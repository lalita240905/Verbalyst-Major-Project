import { FusedSegment } from "./analysis";

const API_BASE = "http://localhost:8000";

export interface ProcessAudioResponse {
  status: string;
  source: "ml_server" | "static";
  filename: string;
  fused: FusedSegment[];
}

export async function processAudio(file: File): Promise<ProcessAudioResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/api/process-audio`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detail = errorData?.detail || `Server error: ${response.status}`;
    throw new Error(detail);
  }

  return response.json();
}

const STORAGE_KEY = "verbalyst_analysis_data";

export function storeAnalysisData(data: FusedSegment[]): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadAnalysisData(): FusedSegment[] | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAnalysisData(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
