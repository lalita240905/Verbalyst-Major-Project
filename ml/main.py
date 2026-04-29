import os
import time
import json
import tempfile
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse
from faster_whisper import WhisperModel

from extract_acoustics import extract_acoustics
from fuse import fuse


app = FastAPI()


@app.get("/", response_class=HTMLResponse)
async def root():
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verbalyst ML Pipeline</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Inter', sans-serif;
            background: #0a0a0f;
            color: #e0e0e0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        body::before {
            content: '';
            position: fixed;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle at 30% 40%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
                        radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.06) 0%, transparent 50%);
            animation: drift 20s ease-in-out infinite alternate;
            z-index: 0;
        }

        @keyframes drift {
            0%   { transform: translate(0, 0) rotate(0deg); }
            100% { transform: translate(-3%, 2%) rotate(3deg); }
        }

        .container {
            position: relative;
            z-index: 1;
            width: 520px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 20px;
            padding: 48px 40px;
            backdrop-filter: blur(24px);
            box-shadow: 0 8px 60px rgba(0, 0, 0, 0.5);
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.25);
            color: #10b981;
            font-size: 12px;
            font-weight: 600;
            padding: 6px 14px;
            border-radius: 999px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 28px;
        }

        .badge .dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            50%      { opacity: 0.6; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }

        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #ffffff;
            margin-bottom: 6px;
            letter-spacing: -0.5px;
        }

        .subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 36px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 32px;
        }

        .info-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 16px;
        }

        .info-card .label {
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }

        .info-card .value {
            font-size: 15px;
            font-weight: 600;
            color: #f3f4f6;
        }

        .endpoint-section h2 {
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 14px;
        }

        .endpoint {
            display: flex;
            align-items: center;
            gap: 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 14px 16px;
            transition: border-color 0.2s;
        }

        .endpoint:hover {
            border-color: rgba(99, 102, 241, 0.3);
        }

        .method {
            background: rgba(99, 102, 241, 0.15);
            color: #818cf8;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 6px;
            letter-spacing: 0.5px;
        }

        .endpoint .path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 14px;
            color: #d1d5db;
        }

        .endpoint .desc {
            margin-left: auto;
            font-size: 12px;
            color: #6b7280;
        }

        .footer {
            margin-top: 32px;
            text-align: center;
            font-size: 12px;
            color: #374151;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="badge">
            <span class="dot"></span>
            GPU Online
        </div>

        <h1>Verbalyst ML Pipeline</h1>
        <p class="subtitle">Speech analysis engine &mdash; running on CUDA</p>

        <div class="info-grid">
            <div class="info-card">
                <div class="label">Model</div>
                <div class="value">Whisper Large-v3</div>
            </div>
            <div class="info-card">
                <div class="label">Device</div>
                <div class="value">CUDA &middot; FP16</div>
            </div>
            <div class="info-card">
                <div class="label">Framework</div>
                <div class="value">FastAPI</div>
            </div>
            <div class="info-card">
                <div class="label">Pipeline</div>
                <div class="value">3-Stage</div>
            </div>
        </div>

        <div class="endpoint-section">
            <h2>Endpoints</h2>
            <div class="endpoint">
                <span class="method">POST</span>
                <span class="path">/audio</span>
                <span class="desc">Upload &amp; analyze</span>
            </div>
        </div>

        <p class="footer">Verbalyst &copy; 2026</p>
    </div>
</body>
</html>
"""

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