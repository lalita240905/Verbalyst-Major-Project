from fastapi import FastAPI, UploadFile, File, HTTPException
import httpx
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from database import db

from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from a .env file if present
load_dotenv()

app = FastAPI(title="Verbalyst Backend")

# Allow the frontend to communicate with the backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (e.g. your Vite frontend at localhost:5173)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Verbalyst Backend"}

@app.post("/api/process-audio")
async def process_audio(file: UploadFile = File(...)):
    """
    Receives an audio file, sends it to an external model API, 
    and returns the model's output.
    """
    # 1. Basic validation to ensure it's an audio file
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio file")
        
    try:
        # 2. Read the audio file into memory
        file_content = await file.read()
        
        # 3. Setup the API call to your model
        # NOTE: You'll need to set these variables in your .env file
        model_server_ip = os.getenv("MODEL_SERVER_IP", "127.0.0.1")
        model_server_port = os.getenv("MODEL_SERVER_PORT", "8000")
        
        # Construct the URL using the server IP. Adjust the endpoint path as needed.
        model_api_url = f"http://{model_server_ip}:{model_server_port}/process"
        
        # The structure of `files` and `data` will depend on the specific model's API requirements.
        # This is a common structure for sending multipart/form-data.
        files = {"file": (file.filename, file_content, file.content_type)}
        
        # 4. Make the request to the model's API
        async with httpx.AsyncClient() as client:
            
            # --- UNCOMMENT AND ADJUST THE BLOCK BELOW WHEN YOU HAVE YOUR API DETAILS ---
            '''
            response = await client.post(
                model_api_url,
                files=files,
                timeout=60.0 # Audio processing might take a bit
            )
            
            # Check if the external API request was successful
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Model API error: {response.text}"
                )
                
            return response.json()
            '''
            
            # --- MOCK RESPONSE FOR TESTING ---
            result_data = {
                "status": "success",
                "message": "Audio received. API call is currently mocked.",
                "filename": file.filename,
                "content_type": file.content_type,
                "mock_output": "This is a simulated response. You can integrate your actual model API in backend/main.py.",
                "created_at": datetime.now(timezone.utc)
            }
            
            # Save the result to MongoDB
            await db.audio_results.insert_one(result_data)
            
            # Convert the ObjectId to a string before returning the response
            result_data["_id"] = str(result_data["_id"])
            return result_data
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
