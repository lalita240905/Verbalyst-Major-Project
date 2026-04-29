import { useState, useRef, useCallback } from "react";
import {
  FusedSegment,
  FusedWord,
  getConfidenceColor,
  getEnergyColor,
  getPitchColor,
  getEnergyLabel,
  getPitchLabel,
} from "@/lib/analysis";

type ViewMode = "confidence" | "energy" | "pitch";

interface TimelineProps {
  segments: FusedSegment[];
  allWords: FusedWord[];
  avgPitch: number;
  avgEnergy: number;
  totalDuration: number;
}

interface TooltipData {
  word: FusedWord;
  x: number;
  y: number;
}

function WordBlock({
  word,
  totalDuration,
  viewMode,
  avgPitch,
  avgEnergy,
  speechStart,
  onHover,
  onLeave,
}: {
  word: FusedWord;
  totalDuration: number;
  viewMode: ViewMode;
  avgPitch: number;
  avgEnergy: number;
  speechStart: number;
  onHover: (data: TooltipData) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const duration = Math.max(word.end - word.start, 0.01);
  const widthPercent = (duration / totalDuration) * 100;
  const leftPercent = ((word.start - speechStart) / totalDuration) * 100;

  let bgColor: string;
  switch (viewMode) {
    case "confidence":
      bgColor = getConfidenceColor(word.probability);
      break;
    case "energy":
      bgColor = getEnergyColor(word.acoustics.rms_energy, avgEnergy);
      break;
    case "pitch":
      bgColor = getPitchColor(word.acoustics.mean_pitch_hz, avgPitch);
      break;
  }

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      onHover({
        word,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    }
  }, [word, onHover]);

  return (
    <div
      ref={ref}
      className="absolute top-0 h-full cursor-pointer transition-opacity hover:opacity-80"
      style={{
        left: `${leftPercent}%`,
        width: `${Math.max(widthPercent, 0.3)}%`,
        backgroundColor: bgColor,
        borderRight: "1px solid rgba(0,0,0,0.3)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
    />
  );
}

function PauseBlock({
  start,
  end,
  speechStart,
  totalDuration,
}: {
  start: number;
  end: number;
  speechStart: number;
  totalDuration: number;
}) {
  const duration = end - start;
  if (duration < 0.4) return null;

  const leftPercent = ((start - speechStart) / totalDuration) * 100;
  const widthPercent = (duration / totalDuration) * 100;

  return (
    <div
      className="absolute top-0 h-full flex items-center justify-center"
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        backgroundColor: "rgba(107,114,128,0.2)",
        borderLeft: "1px dashed rgba(107,114,128,0.4)",
        borderRight: "1px dashed rgba(107,114,128,0.4)",
      }}
    >
      {duration >= 0.6 && (
        <span className="text-[9px] font-mono text-[#666] whitespace-nowrap">
          {duration.toFixed(1)}s
        </span>
      )}
    </div>
  );
}

function Tooltip({
  data,
  avgEnergy,
  avgPitch,
}: {
  data: TooltipData;
  avgEnergy: number;
  avgPitch: number;
}) {
  const { word } = data;
  const confPercent = Math.round(word.probability * 100);
  const energyLabel = getEnergyLabel(word.acoustics.rms_energy, avgEnergy);
  const pitchLabel = getPitchLabel(word.acoustics.mean_pitch_hz, avgPitch);

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: data.x,
        top: data.y - 10,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 shadow-xl min-w-[180px]">
        <p className="font-display font-black text-sm text-white mb-1">
          "{word.word}"
        </p>
        <p className="text-[10px] font-mono text-[#666] mb-2">
          at {word.start.toFixed(2)}s
        </p>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span className="text-[#888]">Confidence</span>
            <span
              style={{ color: getConfidenceColor(word.probability) }}
              className="font-bold"
            >
              {confPercent}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Energy</span>
            <span className="text-white font-bold">{energyLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#888]">Pitch</span>
            <span className="text-white font-bold">{pitchLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PitchWaveform({
  segments,
  allWords,
  avgPitch,
  totalDuration,
  speechStart,
}: {
  segments: FusedSegment[];
  allWords: FusedWord[];
  avgPitch: number;
  totalDuration: number;
  speechStart: number;
}) {
  const width = 1000;
  const height = 120;
  const padding = { top: 10, bottom: 20, left: 0, right: 0 };
  const innerH = height - padding.top - padding.bottom;

  const pitchedWords = allWords.filter((w) => w.acoustics.mean_pitch_hz > 0);
  if (pitchedWords.length < 2) return null;

  const maxPitch = Math.max(...pitchedWords.map((w) => w.acoustics.mean_pitch_hz)) * 1.1;
  const minPitch = Math.min(...pitchedWords.map((w) => w.acoustics.mean_pitch_hz)) * 0.9;

  const points = pitchedWords.map((w) => {
    const x = ((w.start - speechStart) / totalDuration) * width;
    const y =
      padding.top +
      innerH -
      ((w.acoustics.mean_pitch_hz - minPitch) / (maxPitch - minPitch)) * innerH;
    return { x, y };
  });

  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const areaPath = linePath + ` L${points[points.length - 1].x},${height - padding.bottom} L${points[0].x},${height - padding.bottom} Z`;

  const avgY =
    padding.top + innerH - ((avgPitch - minPitch) / (maxPitch - minPitch)) * innerH;

  return (
    <div className="mt-4">
      <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#555] mb-2">
        Pitch Over Time
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {segments.map((seg, i) => {
          const x = ((seg.start - speechStart) / totalDuration) * width;
          return (
            <line
              key={i}
              x1={x}
              y1={padding.top}
              x2={x}
              y2={height - padding.bottom}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          );
        })}

        <line
          x1={0}
          y1={avgY}
          x2={width}
          y2={avgY}
          stroke="#a78bfa"
          strokeWidth={1}
          strokeDasharray="6 4"
          opacity={0.4}
        />
        <text
          x={width - 4}
          y={avgY - 4}
          fill="#a78bfa"
          fontSize="9"
          textAnchor="end"
          opacity={0.6}
        >
          avg {Math.round(avgPitch)} Hz
        </text>

        <path d={areaPath} fill="url(#pitchGrad)" />
        <path d={linePath} fill="none" stroke="#a78bfa" strokeWidth={2} />
      </svg>
    </div>
  );
}

export default function Timeline({
  segments,
  allWords,
  avgPitch,
  avgEnergy,
  totalDuration,
}: TimelineProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("confidence");
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const speechStart = segments.length > 0 ? segments[0].start : 0;

  const pauses: { start: number; end: number }[] = [];
  for (let i = 1; i < allWords.length; i++) {
    const gap = allWords[i].start - allWords[i - 1].end;
    if (gap > 0.4) {
      pauses.push({ start: allWords[i - 1].end, end: allWords[i].start });
    }
  }

  const tabs: { mode: ViewMode; label: string }[] = [
    { mode: "confidence", label: "Confidence" },
    { mode: "energy", label: "Energy" },
    { mode: "pitch", label: "Pitch" },
  ];

  const legendItems = {
    confidence: [
      { color: "#22c55e", label: "Clear (90%+)" },
      { color: "#eab308", label: "Borderline (70–90%)" },
      { color: "#ef4444", label: "Unclear (<70%)" },
    ],
    energy: [
      { color: "#3b82f6", label: "Soft" },
      { color: "#60a5fa", label: "Below avg" },
      { color: "#f59e0b", label: "Average" },
      { color: "#ef4444", label: "Loud" },
    ],
    pitch: [
      { color: "#7c3aed", label: "Low" },
      { color: "#c4b5fd", label: "Mid" },
      { color: "#facc15", label: "High" },
    ],
  };

  return (
    <section id="zone-timeline" className="mb-12">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display font-black text-xl text-white">
              Speech Timeline
            </h2>
            <p className="text-xs text-[#666] mt-1">
              Each block is a word. Hover to inspect. Gaps show pauses.
            </p>
          </div>

          <div className="flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  viewMode === tab.mode
                    ? "bg-white text-black"
                    : "text-[#888] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
          {legendItems[viewMode].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-[10px] text-[#888]">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[rgba(107,114,128,0.3)]" />
            <span className="text-[10px] text-[#888]">Pause</span>
          </div>
        </div>

        <div className="relative w-full h-28 bg-[#0a0a0a] rounded-lg overflow-hidden border border-[#1a1a1a]">
          {allWords.map((word, i) => (
            <WordBlock
              key={i}
              word={word}
              totalDuration={totalDuration}
              viewMode={viewMode}
              avgPitch={avgPitch}
              avgEnergy={avgEnergy}
              speechStart={speechStart}
              onHover={setTooltip}
              onLeave={() => setTooltip(null)}
            />
          ))}
          {pauses.map((p, i) => (
            <PauseBlock
              key={`pause-${i}`}
              start={p.start}
              end={p.end}
              speechStart={speechStart}
              totalDuration={totalDuration}
            />
          ))}
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-mono text-[#555]">
            {speechStart.toFixed(1)}s
          </span>
          <span className="text-[10px] font-mono text-[#555]">
            {(speechStart + totalDuration).toFixed(1)}s
          </span>
        </div>

        <PitchWaveform
          segments={segments}
          allWords={allWords}
          avgPitch={avgPitch}
          totalDuration={totalDuration}
          speechStart={speechStart}
        />
      </div>

      {tooltip && (
        <Tooltip data={tooltip} avgEnergy={avgEnergy} avgPitch={avgPitch} />
      )}
    </section>
  );
}
