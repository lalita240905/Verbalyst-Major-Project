"use client";
import { useState, useMemo } from "react";
import { FusedSegment, FusedWord, energyToColor } from "@/lib/api";

interface Props {
  fused: FusedSegment[];
}

interface TooltipData {
  word: FusedWord;
  x: number;
  y: number;
}

export default function TranscriptHeatmap({ fused }: Props) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [colorMode, setColorMode] = useState<"energy" | "pitch" | "probability">("energy");

  const allWords = useMemo(() => fused.flatMap((s) => s.words), [fused]);

  const energyMin = useMemo(() => Math.min(...allWords.map((w) => w.acoustics.rms_energy)), [allWords]);
  const energyMax = useMemo(() => Math.max(...allWords.map((w) => w.acoustics.rms_energy)), [allWords]);
  const pitchMin = useMemo(() => Math.min(...allWords.map((w) => w.acoustics.mean_pitch_hz).filter(Boolean)), [allWords]);
  const pitchMax = useMemo(() => Math.max(...allWords.map((w) => w.acoustics.mean_pitch_hz)), [allWords]);

  const getColor = (word: FusedWord) => {
    if (colorMode === "energy") return energyToColor(word.acoustics.rms_energy, energyMin, energyMax);
    if (colorMode === "pitch") return energyToColor(word.acoustics.mean_pitch_hz, pitchMin, pitchMax);
    return energyToColor(word.probability, 0, 1);
  };

  const handleMouseEnter = (e: React.MouseEvent, word: FusedWord) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltip({ word, x: rect.left + rect.width / 2, y: rect.top });
  };

  return (
    <div>
      {/* Legend & controls */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-cream-dim text-xs font-mono">Color by:</span>
          {[
            { key: "energy", label: "RMS Energy" },
            { key: "pitch", label: "Pitch Hz" },
            { key: "probability", label: "Confidence" },
          ].map((m) => (
            <button key={m.key}
              onClick={() => setColorMode(m.key as typeof colorMode)}
              className="px-3 py-1 rounded-lg text-xs font-mono transition-all"
              style={{
                background: colorMode === m.key ? "rgba(200,241,53,0.15)" : "rgba(255,255,255,0.04)",
                border: colorMode === m.key ? "1px solid rgba(200,241,53,0.3)" : "1px solid rgba(255,255,255,0.08)",
                color: colorMode === m.key ? "var(--volt)" : "var(--cream-dim)",
              }}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-cream-dim">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: "rgba(77,240,200,0.85)" }} />
            <span>Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: "rgba(255,140,0,0.9)" }} />
            <span>Mid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: "rgba(255,30,0,0.95)" }} />
            <span>High</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="border-b border-dotted border-cream-dim pb-0.5">word</span>
            <span>= pause detected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="border border-dashed border-cream-dim px-1">word</span>
            <span>= low confidence</span>
          </div>
        </div>
      </div>

      {/* Heatmap segments */}
      <div className="space-y-6">
        {fused.map((segment, si) => (
          <div key={si} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs px-2 py-1 rounded-md" style={{ background: "rgba(77,240,200,0.1)", color: "var(--wave)", border: "1px solid rgba(77,240,200,0.15)" }}>
                {segment.start.toFixed(2)}s → {segment.end.toFixed(2)}s
              </span>
              <span className="text-xs font-mono text-cream-dim">
                RMS: {segment.acoustic_summary.rms_energy.toFixed(4)} · Pitch: {segment.acoustic_summary.mean_pitch_hz.toFixed(0)}Hz
              </span>
              {segment.acoustic_summary.is_pause && (
                <span className="text-xs font-mono px-2 py-1 rounded-md" style={{ background: "rgba(255,179,64,0.1)", color: "var(--amber)", border: "1px solid rgba(255,179,64,0.2)" }}>
                  ⏸ pause detected
                </span>
              )}
            </div>
            <div className="flex flex-wrap">
              {segment.words.map((word, wi) => (
                <span
                  key={wi}
                  className={`word-chip ${word.acoustics.is_pause ? "is-pause" : ""} ${word.probability < 0.5 ? "low-prob" : ""}`}
                  style={{ background: getColor(word), color: "#0a0a0f" }}
                  onMouseEnter={(e) => handleMouseEnter(e, word)}
                  onMouseLeave={() => setTooltip(null)}>
                  {word.word}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-xl p-4 shadow-2xl"
          style={{
            left: Math.min(tooltip.x, window.innerWidth - 240),
            top: tooltip.y - 180,
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: 200,
            transform: "translateX(-50%)",
          }}>
          <p className="font-display font-700 text-cream text-base mb-3">
            &ldquo;{tooltip.word.word}&rdquo;
          </p>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between gap-4">
              <span className="text-cream-dim">Time</span>
              <span className="text-cream">{tooltip.word.start.toFixed(2)}s → {tooltip.word.end.toFixed(2)}s</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-cream-dim">RMS Energy</span>
              <span style={{ color: "var(--volt)" }}>{tooltip.word.acoustics.rms_energy.toFixed(5)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-cream-dim">Pitch</span>
              <span style={{ color: "var(--wave)" }}>{tooltip.word.acoustics.mean_pitch_hz.toFixed(1)} Hz</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-cream-dim">Pitch Var.</span>
              <span className="text-cream">{tooltip.word.acoustics.pitch_variance.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-cream-dim">Confidence</span>
              <span style={{ color: tooltip.word.probability >= 0.8 ? "var(--volt)" : tooltip.word.probability >= 0.5 ? "var(--amber)" : "var(--signal)" }}>
                {Math.round(tooltip.word.probability * 100)}%
              </span>
            </div>
            {tooltip.word.acoustics.is_pause && (
              <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "var(--amber)" }}>⏸ Pause detected</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
