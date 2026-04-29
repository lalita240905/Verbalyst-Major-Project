const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface WordAcoustics {
  rms_energy: number;
  mean_pitch_hz: number;
  pitch_variance: number;
  is_pause: boolean;
}

export interface FusedWord {
  word: string;
  start: number;
  end: number;
  probability: number;
  acoustics: WordAcoustics;
}

export interface FusedSegment {
  start: number;
  end: number;
  text: string;
  acoustic_summary: WordAcoustics;
  words: FusedWord[];
}

export interface AcousticWindow {
  window_start: number;
  window_end: number;
  rms_energy: number;
  mean_pitch_hz: number;
  pitch_variance: number;
  mfcc_means: number[];
  is_pause: boolean;
}

export interface Word {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface Segment {
  start: number;
  end: number;
  text: string;
  words: Word[];
}

export interface AnalysisResult {
  session_id: string;
  language: string;
  language_probability: number;
  processing_time: number;
  total_pipeline_time: number;
  word_count: number;
  duration: number;
  segments: Segment[];
  words: Word[];
  acoustics: AcousticWindow[];
  fused: FusedSegment[];
}

export interface SessionSummary {
  _id: string;
  filename: string;
  created_at: string;
  language: string;
  language_probability: number;
  processing_time: number;
  total_pipeline_time: number;
  word_count: number;
  duration: number;
  energy_sparkline: number[];
}

export interface SessionDetail extends AnalysisResult {
  _id: string;
  filename: string;
  created_at: string;
  energy_sparkline: number[];
}

export async function uploadAudio(file: File): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/audio`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${err}`);
  }
  return res.json();
}

export async function fetchSessions(): Promise<SessionSummary[]> {
  const res = await fetch(`${API}/sessions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch sessions");
  const data = await res.json();
  return data.sessions;
}

export async function fetchSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${API}/sessions/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Session not found");
  return res.json();
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${API}/sessions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete session");
}

export function energyToColor(
  energy: number,
  min: number,
  max: number
): string {
  if (max === min) return "rgba(200,241,53,0.6)";
  const t = Math.max(0, Math.min(1, (energy - min) / (max - min)));
  if (t < 0.33) {
    const l = t / 0.33;
    return `rgba(${Math.round(77 + l * (255 - 77))}, ${Math.round(240 + l * (179 - 240))}, ${Math.round(200 + l * (64 - 200))}, 0.85)`;
  } else if (t < 0.66) {
    const l = (t - 0.33) / 0.33;
    return `rgba(255, ${Math.round(179 - l * (179 - 100))}, ${Math.round(64 - l * 64)}, 0.9)`;
  } else {
    const l = (t - 0.66) / 0.34;
    return `rgba(${Math.round(255)}, ${Math.round(100 - l * 100)}, ${Math.round(0)}, 0.95)`;
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
