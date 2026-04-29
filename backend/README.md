# Verbalyst Backend

This is the FastAPI backend for the Verbalyst project. It is designed to receive audio files, forward them to an external AI model API, and return the response.

## Prerequisites

- Python 3.8+

## Setup Instructions

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up Environment Variables:**
   - Copy the `.env.example` file to a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open the `.env` file and replace the placeholder values with your actual Model Server IP and Port.

## Running the Server

Start the development server using Uvicorn:

```bash
uvicorn main:app --reload
```

The server will start at `http://127.0.0.1:8000`.

## API Documentation

FastAPI automatically generates interactive API documentation. Once the server is running, you can view and test the API at:
- **Swagger UI:** `http://127.0.0.1:8000/docs`
- **ReDoc:** `http://127.0.0.1:8000/redoc`

## Integration

To integrate the actual model API, open `main.py` and look for the `process_audio` endpoint. There is a commented-out section where you can uncomment and adjust the `httpx` code to send the audio to your specific model endpoint.
