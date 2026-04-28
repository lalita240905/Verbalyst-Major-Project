# SFE Pipeline — Build Guide
## From Working Whisper → Full Fusion JSON

---

## Where You Are Right Now

You have a working faster-whisper script. It outputs **segment-level** timestamps.  
That's not enough. The fusion layer needs to know *which word* was spoken at *which millisecond* — not just which sentence.

**Current output:**
```
[13.82s -> 14.98s]  The human voice.
```

**Target output (after this guide):**
```json
{ "word": "human", "start": 14.10, "end": 14.55 }
```

---

## Step 1 — Enable Word-Level Timestamps in Whisper

One parameter change. In your `model.transcribe()` call, add `word_timestamps=True`.

**Update your script:**

```python
import os
import time
import json
from faster_whisper import WhisperModel

def transcribe_audio():
    print("Starting Transcription Script...", flush=True)

    device = "cuda"
    compute_type = "float16"
    model_size = "large-v3"

    print(f"Loading Whisper model ({model_size}) on {device}...", flush=True)
    model = WhisperModel(model_size, device=device, compute_type=compute_type)

    audio_path = "./audio.mp3"
    output_dir = "outputs"
    os.makedirs(output_dir, exist_ok=True)

    print(f"Processing: {audio_path}", flush=True)
    start_time = time.time()

    # KEY CHANGE: word_timestamps=True
    segments, info = model.transcribe(
        audio_path,
        beam_size=5,
        vad_filter=True,
        word_timestamps=True  # <-- THIS
    )

    print(f"Detected Language: {info.language} ({info.language_probability:.2f})")

    all_words = []
    all_segments = []

    for segment in segments:
        seg_data = {
            "start": round(segment.start, 3),
            "end": round(segment.end, 3),
            "text": segment.text.strip(),
            "words": []
        }

        # Each segment now has a .words list
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
        print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}", flush=True)

    # Save word-level JSON
    words_path = os.path.join(output_dir, "words.json")
    with open(words_path, "w", encoding="utf-8") as f:
        json.dump(all_words, f, indent=2)

    # Save segment-level JSON
    segments_path = os.path.join(output_dir, "segments.json")
    with open(segments_path, "w", encoding="utf-8") as f:
        json.dump(all_segments, f, indent=2)

    elapsed = time.time() - start_time
    print(f"\nDone in {elapsed:.2f}s")
    print(f"Words saved to: {words_path}")
    print(f"Segments saved to: {segments_path}")

if __name__ == "__main__":
    try:
        transcribe_audio()
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise
```

**What you get in `outputs/words.json`:**
```json
[
  { "word": "The", "start": 13.82, "end": 13.95, "probability": 0.99 },
  { "word": "human", "start": 13.95, "end": 14.31, "probability": 0.98 },
  { "word": "voice", "start": 14.31, "end": 14.98, "probability": 0.97 }
]
```

This is your **Linguistic Stream**. Done.

---

## Step 2 — Acoustic Feature Extraction with Librosa

Install it in your venv:
```bash
pip install librosa soundfile
```

Create a new file: `extract_acoustics.py`

```python
import librosa
import numpy as np
import json
import os

def extract_acoustics(audio_path: str, hop_duration: float = 0.5) -> list:
    """
    Extracts acoustic features from audio in time windows.
    
    hop_duration: size of each analysis window in seconds (0.5 = every 500ms)
    Returns: list of feature dicts, one per window
    """
    print(f"Loading audio: {audio_path}", flush=True)

    # Load audio — librosa converts everything to mono float32
    y, sr = librosa.load(audio_path, sr=None, mono=True)
    
    total_duration = librosa.get_duration(y=y, sr=sr)
    hop_length = int(sr * hop_duration)  # samples per window

    print(f"Sample Rate: {sr}Hz | Duration: {total_duration:.2f}s", flush=True)

    features = []
    num_windows = int(np.ceil(total_duration / hop_duration))

    for i in range(num_windows):
        start_sample = i * hop_length
        end_sample = min(start_sample + hop_length, len(y))
        window = y[start_sample:end_sample]

        t_start = round(i * hop_duration, 3)
        t_end = round(min((i + 1) * hop_duration, total_duration), 3)

        # --- FEATURE 1: RMS Energy ---
        # How loud/energetic is the speaker in this window
        rms = float(np.sqrt(np.mean(window ** 2)))

        # --- FEATURE 2: Pitch (Fundamental Frequency f0) ---
        # The "melody" of the voice. Flat pitch = monotone. High variance = expressive.
        f0, voiced_flag, _ = librosa.pyin(
            window,
            fmin=librosa.note_to_hz('C2'),   # ~65 Hz, lowest reasonable voice
            fmax=librosa.note_to_hz('C7'),   # ~2093 Hz, highest reasonable voice
            sr=sr
        )
        # Filter out unvoiced frames (silence/noise)
        voiced_f0 = f0[voiced_flag] if f0 is not None else np.array([])
        mean_pitch = float(np.mean(voiced_f0)) if len(voiced_f0) > 0 else 0.0
        pitch_variance = float(np.var(voiced_f0)) if len(voiced_f0) > 0 else 0.0

        # --- FEATURE 3: MFCCs (Timbre/Texture) ---
        # 13 coefficients that describe the "color" of the voice
        # We take the mean across the window — gives a fingerprint of vocal quality
        if len(window) > 0:
            mfccs = librosa.feature.mfcc(y=window, sr=sr, n_mfcc=13)
            mfcc_means = mfccs.mean(axis=1).tolist()
        else:
            mfcc_means = [0.0] * 13

        # --- FEATURE 4: Is there a pause here? ---
        # Simple threshold: if RMS < 0.01, treat as silence/pause
        is_pause = rms < 0.01

        features.append({
            "window_start": t_start,
            "window_end": t_end,
            "rms_energy": round(rms, 6),
            "mean_pitch_hz": round(mean_pitch, 3),
            "pitch_variance": round(pitch_variance, 3),
            "mfcc_means": [round(v, 4) for v in mfcc_means],
            "is_pause": is_pause
        })

        if i % 20 == 0:
            print(f"  Processed window {i+1}/{num_windows} ({t_start:.1f}s)", flush=True)

    print(f"Acoustic extraction complete. {len(features)} windows.", flush=True)
    return features


if __name__ == "__main__":
    audio_path = "./audio.mp3"
    output_dir = "outputs"
    os.makedirs(output_dir, exist_ok=True)

    features = extract_acoustics(audio_path, hop_duration=0.5)

    output_path = os.path.join(output_dir, "acoustics.json")
    with open(output_path, "w") as f:
        json.dump(features, f, indent=2)

    print(f"Saved to: {output_path}")
```

**What you get in `outputs/acoustics.json`:**
```json
[
  {
    "window_start": 0.0,
    "window_end": 0.5,
    "rms_energy": 0.043,
    "mean_pitch_hz": 142.5,
    "pitch_variance": 210.3,
    "mfcc_means": [−200.1, 87.3, ...],
    "is_pause": false
  }
]
```

This is your **Acoustic Stream**. Done.

---

## Step 3 — The Fusion Layer

This is the core of the entire product. You now have:
- `words.json` → every word with millisecond timestamps
- `acoustics.json` → acoustic features every 500ms

The fusion script answers: **"What were the acoustic conditions when each word was spoken?"**

Create `fuse.py`:

```python
import json
import os

def load_json(path):
    with open(path) as f:
        return json.load(f)

def find_acoustic_window(acoustics: list, t_start: float, t_end: float) -> dict:
    """
    Given a word's time range, find all acoustic windows that overlap with it.
    Return averaged features across those windows.
    """
    overlapping = []
    for window in acoustics:
        # Check overlap
        if window["window_end"] > t_start and window["window_start"] < t_end:
            overlapping.append(window)

    if not overlapping:
        return {
            "rms_energy": 0.0,
            "mean_pitch_hz": 0.0,
            "pitch_variance": 0.0,
            "is_pause": False
        }

    # Average the numeric features across overlapping windows
    return {
        "rms_energy": round(sum(w["rms_energy"] for w in overlapping) / len(overlapping), 6),
        "mean_pitch_hz": round(sum(w["mean_pitch_hz"] for w in overlapping) / len(overlapping), 3),
        "pitch_variance": round(sum(w["pitch_variance"] for w in overlapping) / len(overlapping), 3),
        "is_pause": any(w["is_pause"] for w in overlapping)
    }

def fuse(words_path: str, acoustics_path: str, segments_path: str) -> list:
    words = load_json(words_path)
    acoustics = load_json(acoustics_path)
    segments = load_json(segments_path)

    fused = []

    for segment in segments:
        fused_segment = {
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"],
            "acoustic_summary": find_acoustic_window(acoustics, segment["start"], segment["end"]),
            "words": []
        }

        for word in segment["words"]:
            acoustic = find_acoustic_window(acoustics, word["start"], word["end"])
            fused_word = {
                "word": word["word"],
                "start": word["start"],
                "end": word["end"],
                "probability": word["probability"],
                "acoustics": acoustic
            }
            fused_segment["words"].append(fused_word)

        fused.append(fused_segment)

    return fused

if __name__ == "__main__":
    output_dir = "outputs"

    fused_data = fuse(
        words_path=os.path.join(output_dir, "words.json"),
        acoustics_path=os.path.join(output_dir, "acoustics.json"),
        segments_path=os.path.join(output_dir, "segments.json")
    )

    output_path = os.path.join(output_dir, "fused.json")
    with open(output_path, "w") as f:
        json.dump(fused_data, f, indent=2)

    print(f"Fusion complete. Saved to: {output_path}")
```

**What you get in `outputs/fused.json`:**
```json
[
  {
    "start": 13.82,
    "end": 14.98,
    "text": "The human voice.",
    "acoustic_summary": {
      "rms_energy": 0.043,
      "mean_pitch_hz": 142.5,
      "pitch_variance": 210.3,
      "is_pause": false
    },
    "words": [
      {
        "word": "human",
        "start": 13.95,
        "end": 14.31,
        "probability": 0.98,
        "acoustics": {
          "rms_energy": 0.041,
          "mean_pitch_hz": 139.2,
          "pitch_variance": 198.0,
          "is_pause": false
        }
      }
    ]
  }
]
```

**This is the foundation of everything.** Every feature downstream reads from this file.

---

## Step 4 — Run Order on HPC

Run these three scripts in sequence via SLURM:

```bash
python transcribe.py      # → outputs/words.json + outputs/segments.json
python extract_acoustics.py  # → outputs/acoustics.json
python fuse.py            # → outputs/fused.json
```

Or chain them in one SLURM job:
```bash
python transcribe.py && python extract_acoustics.py && python fuse.py
```

---

## What You Have After This

| File | What it is |
|---|---|
| `outputs/words.json` | Every word + millisecond timestamp |
| `outputs/segments.json` | Sentence-level chunks |
| `outputs/acoustics.json` | Acoustic features per 500ms window |
| `outputs/fused.json` | **The product's brain — everything aligned** |

---

## What Comes Next (Don't Build Yet)

1. **LLM Coaching Layer** — send `fused.json` to Groq Llama, get structured feedback JSON back
2. **Weakness Profile Generator** — parse LLM output into `{ type, severity }` objects
3. **FastAPI wrapper** — expose the pipeline as HTTP endpoints
4. **Next.js frontend** — heatmap UI built on top of `fused.json`
5. **Daily Drill Generator** — Groq call using weakness profile

---

## Key Concepts to Understand (Not Just Use)

**Why word-level timestamps matter:**  
The heatmap needs to highlight *specific words*, not sentences. "You lost energy at the word *'revenue'*" is 10x more useful than "you lost energy around 14 seconds."

**Why librosa over wav2vec for v1:**  
wav2vec is a deep neural net designed for speech *representation learning*. For raw acoustic features (pitch, energy), librosa's signal processing functions are faster, interpretable, and require zero GPU inference. Use wav2vec later if you need emotion classification.

**Why 500ms windows:**  
Human speech changes meaningfully at the syllable level (~200ms). 500ms gives you clean overlap with most words without excessive computation. You can go to 250ms later if you need finer granularity.

**What MFCCs actually are:**  
Mel-Frequency Cepstral Coefficients — they mimic how the human ear perceives sound. The first coefficient (MFCC-1) roughly tracks overall energy. MFCC 2-13 track spectral shape — which directly correlates with vocal quality, tension, and resonance. You don't need to deeply understand the math yet. Just know: flat MFCCs across a session = robotic delivery.