import os
import time
import json
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
from dotenv import load_dotenv

load_dotenv()

from extract_acoustics import extract_acoustics
from fuse import fuse
from db import initialize_storage, insert_session, get_all_sessions, get_session_by_id, delete_session_by_id

app = FastAPI(title="Speech Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OUTPUT_DIR = "outputs"
DEVICE = os.getenv("DEVICE", "cuda")
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "float16")
MODEL_SIZE = os.getenv("MODEL_SIZE", "large-v3")


@app.on_event("startup")
async def startup_event():
    await initialize_storage()

print(f"Loading Whisper model ({MODEL_SIZE}) on {DEVICE}...")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
print("Model loaded.")


def run_transcription(audio_path: str) -> dict:
    print("\n[STAGE 1/3] Transcription...", flush=True)
    start = time.time()

    segments_gen, info = model.transcribe(
        audio_path,
        beam_size=5,
        vad_filter=True,
        word_timestamps=True
    )

    all_words = []
    all_segments = []

    for segment in segments_gen:
        seg_data = {
            "start": round(segment.start, 3),
            "end": round(segment.end, 3),
            "text": segment.text.strip(),
            "words": []
        }
        for word in segment.words:
            word_data = {
                "word": word.word.strip(),
                "start": round(word.start, 3),
                "end": round(word.end, 3),
                "probability": round(word.probability, 3)
            }
            seg_data["words"].append(word_data)
            all_words.append(word_data)
        all_segments.append(seg_data)

    elapsed = round(time.time() - start, 2)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(os.path.join(OUTPUT_DIR, "words.json"), "w") as f:
        json.dump(all_words, f, indent=2)
    with open(os.path.join(OUTPUT_DIR, "segments.json"), "w") as f:
        json.dump(all_segments, f, indent=2)

    print(f"[STAGE 1/3] Done in {elapsed}s", flush=True)
    return {
        "language": info.language,
        "language_probability": round(info.language_probability, 3),
        "segments": all_segments,
        "words": all_words,
        "processing_time": elapsed
    }


def run_acoustics(audio_path: str) -> list:
    print("\n[STAGE 2/3] Acoustic extraction...", flush=True)
    features = extract_acoustics(audio_path, hop_duration=0.5)
    with open(os.path.join(OUTPUT_DIR, "acoustics.json"), "w") as f:
        json.dump(features, f, indent=2)
    print(f"[STAGE 2/3] Done — {len(features)} windows", flush=True)
    return features


def run_fusion() -> list:
    print("\n[STAGE 3/3] Fusion...", flush=True)
    fused_data = fuse(
        words_path=os.path.join(OUTPUT_DIR, "words.json"),
        acoustics_path=os.path.join(OUTPUT_DIR, "acoustics.json"),
        segments_path=os.path.join(OUTPUT_DIR, "segments.json")
    )
    with open(os.path.join(OUTPUT_DIR, "fused.json"), "w") as f:
        json.dump(fused_data, f, indent=2)
    print(f"[STAGE 3/3] Done — {len(fused_data)} fused segments", flush=True)
    return fused_data


@app.post("/audio")
async def transcribe_audio(file: UploadFile = File(...)):
    pipeline_start = time.time()
    filename = file.filename or "audio.mp3"

    suffix = os.path.splitext(filename)[-1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        transcription = run_transcription(tmp_path)
        acoustics = run_acoustics(tmp_path)
        fused = run_fusion()

        total_elapsed = round(time.time() - pipeline_start, 2)

        # Compute summary stats
        words = transcription["words"]
        rms_values = [w.get("rms_energy", 0) for seg in fused for w in seg["words"] if "acoustics" in w]
        energy_sparkline = [round(a["rms_energy"], 6) for a in acoustics[::2]]  # every 1s

        duration = 0
        if transcription["segments"]:
            duration = transcription["segments"][-1]["end"]

        session_data = {
            "filename": filename,
            "language": transcription["language"],
            "language_probability": transcription["language_probability"],
            "processing_time": transcription["processing_time"],
            "total_pipeline_time": total_elapsed,
            "word_count": len(words),
            "duration": round(duration, 2),
            "energy_sparkline": energy_sparkline,
            "segments": transcription["segments"],
            "words": words,
            "acoustics": acoustics,
            "fused": fused
        }

        session_id = await insert_session(session_data)
        print(f"\nPIPELINE COMPLETE in {total_elapsed}s | Session: {session_id}", flush=True)

        return {
            "session_id": session_id,
            "language": transcription["language"],
            "language_probability": transcription["language_probability"],
            "processing_time": transcription["processing_time"],
            "total_pipeline_time": total_elapsed,
            "word_count": len(words),
            "duration": round(duration, 2),
            "segments": transcription["segments"],
            "words": words,
            "acoustics": acoustics,
            "fused": fused
        }

    finally:
        os.remove(tmp_path)


@app.get("/sessions")
async def list_sessions():
    sessions = await get_all_sessions()
    return {"sessions": sessions}


@app.get("/sessions/{session_id}")
async def get_session(session_id: str):
    session = await get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    success = await delete_session_by_id(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}


@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}
