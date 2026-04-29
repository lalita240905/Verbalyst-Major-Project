"use client";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadAudio } from "@/lib/api";

type Stage = "idle" | "uploading" | "transcribing" | "acoustics" | "fusing" | "done" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  uploading: "Uploading audio file…",
  transcribing: "Stage 1/3 — Transcribing with Whisper…",
  acoustics: "Stage 2/3 — Extracting acoustic features…",
  fusing: "Stage 3/3 — Fusing streams…",
  done: "Complete!",
  error: "Something went wrong.",
};

export default function HomePage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    const allowed = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg", "audio/webm", "audio/flac", "audio/x-m4a"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|flac|webm)$/i)) {
      setError("Please upload an audio file (MP3, WAV, M4A, FLAC, OGG).");
      return;
    }

    setError("");
    setStage("uploading");

    // Simulate stage progression while waiting for server
    const timer1 = setTimeout(() => setStage("transcribing"), 1500);
    const timer2 = setTimeout(() => setStage("acoustics"), 6000);
    const timer3 = setTimeout(() => setStage("fusing"), 14000);

    try {
      const result = await uploadAudio(file);
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
      setStage("done");
      setTimeout(() => router.push(`/sessions/${result.session_id}`), 600);
    } catch (e: unknown) {
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
      setStage("error");
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }, [router]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const isProcessing = ["uploading", "transcribing", "acoustics", "fusing"].includes(stage);

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-6 py-20">
      {/* Hero text */}
      <div className="text-center mb-16 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-mono tracking-widest uppercase"
          style={{ background: "rgba(200,241,53,0.08)", border: "1px solid rgba(200,241,53,0.2)", color: "var(--volt)" }}>
          <span className="w-2 h-2 rounded-full bg-volt animate-pulse inline-block" />
          AI Speech Analysis
        </div>
        <h1 className="font-display text-6xl md:text-7xl font-800 tracking-tight text-cream leading-none mb-6">
          Hear what your
          <br />
          <span style={{ color: "var(--volt)" }}>voice reveals.</span>
        </h1>
        <p className="text-cream-dim text-xl font-body font-300 leading-relaxed">
          Upload any audio. Get word-level acoustic analysis — energy, pitch, pauses,
          <br className="hidden md:block" /> and vocal delivery insights powered by Whisper + Librosa.
        </p>
      </div>

      {/* Upload zone */}
      <div className="w-full max-w-2xl">
        {!isProcessing && stage !== "done" ? (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className="relative rounded-2xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center py-20 px-8 text-center"
            style={{
              border: dragging ? "2px solid var(--volt)" : "2px dashed rgba(255,255,255,0.12)",
              background: dragging ? "rgba(200,241,53,0.04)" : "rgba(255,255,255,0.02)",
              boxShadow: dragging ? "0 0 40px rgba(200,241,53,0.1)" : "none",
            }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "rgba(200,241,53,0.1)", border: "1px solid rgba(200,241,53,0.2)" }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 4v16M10 10l6-6 6 6" stroke="var(--volt)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 22v2a2 2 0 002 2h16a2 2 0 002-2v-2" stroke="var(--volt)" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-cream font-display font-600 text-xl mb-2">Drop your audio here</p>
            <p className="text-cream-dim font-body text-sm">or click to browse — MP3, WAV, M4A, FLAC, OGG</p>
            <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={onFileChange} />
          </div>
        ) : stage === "error" ? (
          <div className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(255,77,109,0.08)", border: "1px solid rgba(255,77,109,0.3)" }}>
            <p className="text-signal font-display font-600 text-xl mb-2">Error</p>
            <p className="text-cream-dim font-body text-sm mb-6">{error}</p>
            <button onClick={() => { setStage("idle"); setError(""); }}
              className="px-6 py-3 rounded-xl font-display font-600 text-sm transition-all"
              style={{ background: "var(--signal)", color: "#fff" }}>
              Try again
            </button>
          </div>
        ) : (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: "rgba(200,241,53,0.04)", border: "1px solid rgba(200,241,53,0.2)" }}>
            {/* Animated waveform */}
            <div className="audio-wave flex items-center justify-center gap-1 mb-8">
              {[...Array(12)].map((_, i) => (
                <span key={i} style={{ animationDelay: `${i * 0.08}s`, height: `${12 + Math.sin(i) * 8}px` }} />
              ))}
            </div>
            <p className="text-cream font-display font-600 text-xl mb-2">
              {stage === "done" ? "Analysis complete!" : "Analysing…"}
            </p>
            <p className="text-volt font-mono text-sm">{STAGE_LABELS[stage]}</p>

            {/* Progress bar */}
            <div className="mt-6 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-1000"
                style={{
                  background: "var(--volt)",
                  width: stage === "uploading" ? "15%" : stage === "transcribing" ? "40%" : stage === "acoustics" ? "70%" : stage === "fusing" ? "90%" : "100%"
                }} />
            </div>
          </div>
        )}

        {error && stage !== "error" && (
          <p className="text-signal text-sm text-center mt-4 font-body">{error}</p>
        )}
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-16">
        {[
          { icon: "⚡", label: "Whisper large-v3" },
          { icon: "🎵", label: "Pitch & Energy" },
          { icon: "🔬", label: "MFCC Timbre" },
          { icon: "📍", label: "Word-level timestamps" },
          { icon: "💾", label: "MySQL history" },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--cream-dim)" }}>
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
