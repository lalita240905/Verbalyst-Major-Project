from fastapi import FastAPI, UploadFile, File, HTTPException
import httpx
import json
import os
from pathlib import Path
from dotenv import load_dotenv

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Verbalyst Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DATA_DIR = Path(__file__).resolve().parent.parent / "ml" / "outputs"

USE_ML_SERVER = os.getenv("USE_ML_SERVER", "false").lower() == "true"
MODEL_SERVER_IP = os.getenv("MODEL_SERVER_IP", "127.0.0.1")
MODEL_SERVER_PORT = os.getenv("MODEL_SERVER_PORT", "8001")


@app.get("/")
def read_root():
    return {"message": "Welcome to the Verbalyst Backend"}


@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    Receives an audio file.
    - If USE_ML_SERVER=true in .env → forwards to the ML FastAPI server
    - Otherwise → returns static fused.json from ml/outputs
    """
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")

    if USE_ML_SERVER:
        return await _forward_to_ml_server(file)
    else:
        return await _return_static_data(file)


async def _forward_to_ml_server(file: UploadFile):
    file_content = await file.read()
    model_api_url = f"http://{MODEL_SERVER_IP}:{MODEL_SERVER_PORT}/audio"
    files = {"file": (file.filename, file_content, file.content_type)}

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(model_api_url, files=files)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ML server error: {response.text}"
                )

            data = response.json()

            return {
                "status": "success",
                "source": "ml_server",
                "filename": file.filename,
                "fused": data.get("fused", []),
            }
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="ML server is not reachable. Start it with: uvicorn main:app --port 8001 (in the ml/ directory)"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def _return_static_data(file: UploadFile):
    fused_path = STATIC_DATA_DIR / "fused.json"

    if not fused_path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Static data not found at {fused_path}. Run the ML pipeline first."
        )

    with open(fused_path, "r") as f:
        fused_data = json.load(f)

    return {
        "status": "success",
        "source": "static",
        "filename": file.filename,
        "fused": fused_data,
    }
