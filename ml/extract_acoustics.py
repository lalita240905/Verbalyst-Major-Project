import librosa
import numpy as np
import json
import os


def extract_acoustics(audio_path: str, hop_duration: float = 0.5) -> list:
    print(f"Loading audio: {audio_path}", flush=True)

    y, sr = librosa.load(audio_path, sr=None, mono=True)

    total_duration = librosa.get_duration(y=y, sr=sr)
    hop_length = int(sr * hop_duration)

    print(f"Sample Rate: {sr}Hz | Duration: {total_duration:.2f}s", flush=True)

    features = []
    num_windows = int(np.ceil(total_duration / hop_duration))

    for i in range(num_windows):
        start_sample = i * hop_length
        end_sample = min(start_sample + hop_length, len(y))
        window = y[start_sample:end_sample]

        t_start = round(i * hop_duration, 3)
        t_end = round(min((i + 1) * hop_duration, total_duration), 3)

        rms = float(np.sqrt(np.mean(window ** 2)))

        f0, voiced_flag, _ = librosa.pyin(
            window,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr
        )
        voiced_f0 = f0[voiced_flag] if f0 is not None else np.array([])
        mean_pitch = float(np.mean(voiced_f0)) if len(voiced_f0) > 0 else 0.0
        pitch_variance = float(np.var(voiced_f0)) if len(voiced_f0) > 0 else 0.0

        if len(window) > 0:
            mfccs = librosa.feature.mfcc(y=window, sr=sr, n_mfcc=13)
            mfcc_means = mfccs.mean(axis=1).tolist()
        else:
            mfcc_means = [0.0] * 13

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
