import { FusedSegment } from "./analysis";

const API_BASE = "http://localhost:8000";

export interface ProcessAudioResponse {
  status: string;
  source: string;
  analysis_id: string;
  filename: string;
  audio_url: string;
  language: string;
  language_probability: number;
  processing_time: number;
  total_pipeline_time: number;
  fused: FusedSegment[];
}

export interface AnalysisSummary {
  _id: string;
  filename: string;
  created_at: string;
  audio_url: string;
  language: string;
  processing_time: number;
  total_pipeline_time: number;
}

export interface AnalysisDetail {
  _id: string;
  filename: string;
  created_at: string;
  audio_url: string;
  language: string;
  language_probability: number;
  processing_time: number;
  total_pipeline_time: number;
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

export async function fetchAnalyses(): Promise<AnalysisSummary[]> {
  const response = await fetch(`${API_BASE}/api/analyses`);
  if (!response.ok) throw new Error("Failed to fetch analyses");
  return response.json();
}

export async function fetchAnalysis(id: string): Promise<AnalysisDetail> {
  const response = await fetch(`${API_BASE}/api/analyses/${id}`);
  if (!response.ok) throw new Error("Analysis not found");
  return response.json();
}

const STORAGE_KEY = "verbalyst_analysis_data";
const META_KEY = "verbalyst_analysis_meta";

export interface AnalysisMeta {
  analysis_id: string;
  filename: string;
  audio_url: string;
  language: string;
  processing_time: number;
  total_pipeline_time: number;
}

export function storeAnalysisData(data: FusedSegment[], meta: AnalysisMeta): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  sessionStorage.setItem(META_KEY, JSON.stringify(meta));
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

export function loadAnalysisMeta(): AnalysisMeta | null {
  const raw = sessionStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAnalysisData(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(META_KEY);
}
