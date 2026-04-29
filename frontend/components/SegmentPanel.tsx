"use client";
import { useState } from "react";
import { FusedSegment, FusedWord, energyToColor } from "@/lib/api";

interface Props {
  fused: FusedSegment[];
}

function WordRow({ word, eMin, eMax }: { word: FusedWord; eMin: number; eMax: number }) {
  const color = energyToColor(word.acoustics.rms_energy, eMin, eMax);
  return (
    <div className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-white/5 transition-colors">
      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
      <span className="font-mono text-sm text-cream flex-shrink-0 w-28 truncate">{word.word}</span>
      <span className="font-mono text-xs text-cream-dim flex-shrink-0 w-28">
        {word.start.toFixed(2)}s → {word.end.toFixed(2)}s
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (word.acoustics.rms_energy / eMax) * 100)}%`, background: color }} />
      </div>
      <span className="font-mono text-xs w-16 text-right flex-shrink-0" style={{ color: "var(--wave)" }}>
        {word.acoustics.mean_pitch_hz.toFixed(0)} Hz
      </span>
      <span className={`font-mono text-xs w-12 text-right flex-shrink-0`}
        style={{ color: word.probability >= 0.8 ? "var(--volt)" : word.probability >= 0.5 ? "var(--amber)" : "var(--signal)" }}>
        {Math.round(word.probability * 100)}%
      </span>
    </div>
  );
}

export default function SegmentPanel({ fused }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const allWords = fused.flatMap((s) => s.words);
  const eMin = Math.min(...allWords.map((w) => w.acoustics.rms_energy));
  const eMax = Math.max(...allWords.map((w) => w.acoustics.rms_energy));

  const toggle = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {/* Column headers */}
      <div className="flex items-center gap-4 px-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-3" />
        <span className="font-mono text-xs text-cream-dim w-28">Word</span>
        <span className="font-mono text-xs text-cream-dim w-28">Timestamp</span>
        <span className="font-mono text-xs text-cream-dim flex-1">Energy</span>
        <span className="font-mono text-xs text-cream-dim w-16 text-right">Pitch</span>
        <span className="font-mono text-xs text-cream-dim w-12 text-right">Conf.</span>
      </div>

      {fused.map((segment, si) => {
        const isOpen = expanded.has(si);
        const pauseCount = segment.words.filter((w) => w.acoustics.is_pause).length;
        const avgEnergy = segment.words.reduce((a, w) => a + w.acoustics.rms_energy, 0) / segment.words.length;

        return (
          <div key={si} className="segment-row overflow-hidden">
            {/* Segment header */}
            <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => toggle(si)}>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-cream leading-snug line-clamp-2">{segment.text}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="font-mono text-xs px-2 py-1 rounded-md" style={{ background: "rgba(77,240,200,0.08)", color: "var(--wave)" }}>
                  {segment.start.toFixed(1)}s–{segment.end.toFixed(1)}s
                </span>
                <div className="text-right">
                  <p className="font-mono text-xs text-volt">{segment.words.length} words</p>
                  {pauseCount > 0 && (
                    <p className="font-mono text-xs" style={{ color: "var(--amber)" }}>{pauseCount} pauses</p>
                  )}
                </div>
                {/* Mini energy bar */}
                <div className="w-16 text-right">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (avgEnergy / eMax) * 100)}%`, background: energyToColor(avgEnergy, eMin, eMax) }} />
                  </div>
                  <p className="font-mono text-xs mt-1 text-cream-dim">{avgEnergy.toFixed(4)}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  className="transition-transform flex-shrink-0"
                  style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", color: "var(--cream-dim)" }}>
                  <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {/* Expanded word rows */}
            {isOpen && (
              <div className="px-4 pb-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Segment acoustic summary */}
                <div className="flex gap-4 py-3 mb-2 text-xs font-mono flex-wrap">
                  <span className="text-cream-dim">Segment summary:</span>
                  <span style={{ color: "var(--volt)" }}>RMS {segment.acoustic_summary.rms_energy.toFixed(5)}</span>
                  <span style={{ color: "var(--wave)" }}>Pitch {segment.acoustic_summary.mean_pitch_hz.toFixed(1)} Hz</span>
                  <span style={{ color: "var(--amber)" }}>Var {segment.acoustic_summary.pitch_variance.toFixed(1)}</span>
                  {segment.acoustic_summary.is_pause && <span style={{ color: "var(--signal)" }}>⏸ pause</span>}
                </div>
                <div className="space-y-0.5">
                  {segment.words.map((word, wi) => (
                    <WordRow key={wi} word={word} eMin={eMin} eMax={eMax} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
