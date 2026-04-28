import os
import time
import json
import tempfile
from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel

from extract_acoustics import extract_acoustics
from fuse import fuse


app = FastAPI()

OUTPUT_DIR = "outputs"
DEVICE = "cuda"
COMPUTE_TYPE = "float16"
MODEL_SIZE = "large-v3"

print(f"Loading Whisper model ({MODEL_SIZE}) on {DEVICE}...")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)


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

    print(f"[STAGE 1/3] Done in {elapsed}s — {info.language} ({round(info.language_probability, 3)})", flush=True)

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

    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        transcription = run_transcription(tmp_path)
        acoustics = run_acoustics(tmp_path)
        fused = run_fusion()

        total_elapsed = round(time.time() - pipeline_start, 2)

        print(f"\nPIPELINE COMPLETE in {total_elapsed}s", flush=True)

        return {
            "language": transcription["language"],
            "language_probability": transcription["language_probability"],
            "processing_time": transcription["processing_time"],
            "total_pipeline_time": total_elapsed,
            "segments": transcription["segments"],
            "words": transcription["words"],
            "acoustics": acoustics,
            "fused": fused
        }

    finally:
        os.remove(tmp_path)