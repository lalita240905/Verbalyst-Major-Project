from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import httpx
import os
import tempfile
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from database import db

load_dotenv()

app = FastAPI(title="Verbalyst Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GPU_API_URL = os.getenv("GPU_API_URL", "http://127.0.0.1:8000")
analyses_collection = db["analyses"]

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)


def upload_to_cloudinary(file_content: bytes, filename: str) -> dict:
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
        tmp.write(file_content)
        tmp_path = tmp.name

    try:
        result = cloudinary.uploader.upload(
            tmp_path,
            resource_type="video",
            folder="verbalyst/audio",
            public_id=f"{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}_{os.path.splitext(filename)[0]}",
        )
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "duration": result.get("duration"),
        }
    finally:
        os.remove(tmp_path)


@app.get("/")
def read_root():
    return {"message": "Welcome to the Verbalyst Backend", "gpu_api": GPU_API_URL}


@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    file_content = await file.read()

    cloud_data = upload_to_cloudinary(file_content, file.filename or "audio.mp3")

    gpu_url = f"{GPU_API_URL.rstrip('/')}/audio"
    files = {"file": (file.filename, file_content, file.content_type)}

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(gpu_url, files=files)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ML server error: {response.text}",
                )

            ml_data = response.json()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail=f"GPU server is not reachable at {gpu_url}. Make sure the ML server is running.",
        )
    except httpx.ReadTimeout:
        raise HTTPException(
            status_code=504,
            detail="GPU server timed out. The audio file may be too large or the server is overloaded.",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    doc = {
        "filename": file.filename,
        "created_at": datetime.now(timezone.utc),
        "audio_url": cloud_data.get("url"),
        "audio_public_id": cloud_data.get("public_id"),
        "audio_duration": cloud_data.get("duration"),
        "language": ml_data.get("language"),
        "language_probability": ml_data.get("language_probability"),
        "processing_time": ml_data.get("processing_time"),
        "total_pipeline_time": ml_data.get("total_pipeline_time"),
        "segments": ml_data.get("segments", []),
        "words": ml_data.get("words", []),
        "acoustics": ml_data.get("acoustics", []),
        "fused": ml_data.get("fused", []),
    }

    result = await analyses_collection.insert_one(doc)
    doc_id = str(result.inserted_id)

    return {
        "status": "success",
        "source": "gpu_pipeline",
        "analysis_id": doc_id,
        "filename": file.filename,
        "audio_url": cloud_data.get("url"),
        "language": ml_data.get("language"),
        "language_probability": ml_data.get("language_probability"),
        "processing_time": ml_data.get("processing_time"),
        "total_pipeline_time": ml_data.get("total_pipeline_time"),
        "fused": ml_data.get("fused", []),
    }


@app.get("/api/analyses")
async def list_analyses():
    cursor = (
        analyses_collection.find(
            {},
            {
                "fused": 0,
                "words": 0,
                "acoustics": 0,
                "segments": 0,
            },
        )
        .sort("created_at", -1)
        .limit(50)
    )
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results


@app.get("/api/analyses/{analysis_id}")
async def get_analysis(analysis_id: str):
    from bson import ObjectId

    if not ObjectId.is_valid(analysis_id):
        raise HTTPException(status_code=400, detail="Invalid analysis ID")

    doc = await analyses_collection.find_one({"_id": ObjectId(analysis_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found")

    doc["_id"] = str(doc["_id"])
    return doc
