import json
import os


def load_json(path):
    with open(path) as f:
        return json.load(f)


def find_acoustic_window(acoustics: list, t_start: float, t_end: float) -> dict:
    overlapping = []
    for window in acoustics:
        if window["window_end"] > t_start and window["window_start"] < t_end:
            overlapping.append(window)

    if not overlapping:
        return {
            "rms_energy": 0.0,
            "mean_pitch_hz": 0.0,
            "pitch_variance": 0.0,
            "is_pause": False
        }

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
