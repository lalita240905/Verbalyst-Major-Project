import { useRef, useCallback } from "react";
import { FusedSegment, FusedWord, getConfidenceColor } from "@/lib/analysis";

interface TranscriptProps {
  segments: FusedSegment[];
  allWords: FusedWord[];
  avgEnergy: number;
  lowConfidenceWords: FusedWord[];
}

function StyledWord({
  word,
  avgEnergy,
}: {
  word: FusedWord;
  avgEnergy: number;
}) {
  const isLowConf = word.probability < 0.75;
  const isHighEnergy = word.acoustics.rms_energy > avgEnergy * 1.5;
  const isPauseWord = word.acoustics.is_pause && word.acoustics.rms_energy < 0.005;

  let className = "relative inline transition-colors duration-150 ";
  let style: React.CSSProperties = {};

  if (isLowConf) {
    className += "underline decoration-2 decoration-red-500 cursor-help ";
    style.color = "#ef4444";
  } else if (isPauseWord) {
    style.color = "#666";
  } else if (isHighEnergy) {
    className += "font-bold ";
    style.color = "#fff";
  } else {
    style.color = "#ccc";
  }

  return (
    <span className="group relative inline">
      <span className={className} style={style}>
        {word.word}
      </span>
      {isLowConf && (
        <span className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#1a1a1a] border border-[#333] rounded px-2 py-1 text-[10px] text-[#ccc] whitespace-nowrap z-50 pointer-events-none shadow-lg">
          {Math.round(word.probability * 100)}% confidence — try articulating this more clearly
        </span>
      )}
    </span>
  );
}

function PauseMarker({ duration }: { duration: number }) {
  if (duration < 0.5) return null;

  return (
    <span className="inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-[#1a1a1a] border border-[#2a2a2a]">
      <span className="text-[9px] font-mono text-[#666] font-bold">
        {duration.toFixed(1)}s
      </span>
    </span>
  );
}

export default function Transcript({
  segments,
  avgEnergy,
  lowConfidenceWords,
}: TranscriptProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleJumpToTimeline = useCallback((timestamp: number) => {
    const el = document.getElementById("zone-timeline");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return (
    <section id="zone-transcript" className="mb-12">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
        <h2 className="font-display font-black text-xl text-white mb-1">
          Annotated Transcript
        </h2>
        <p className="text-xs text-[#666] mb-6">
          <span className="text-red-500 underline decoration-2">Red underline</span> = unclear &nbsp;
          <span className="font-bold text-white">Bold</span> = emphasized &nbsp;
          <span className="text-[#666]">Grey</span> = hesitant
        </p>

        <div
          ref={timelineRef}
          className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-6 leading-[2.2] text-[15px]"
        >
          {segments.map((seg, segIdx) => {
            const wordsWithPauses: React.ReactNode[] = [];

            seg.words.forEach((word, wordIdx) => {
              if (wordIdx > 0) {
                const prevWord = seg.words[wordIdx - 1];
                const gap = word.start - prevWord.end;
                if (gap > 0.5) {
                  wordsWithPauses.push(
                    <PauseMarker key={`pause-${segIdx}-${wordIdx}`} duration={gap} />
                  );
                }
              }

              wordsWithPauses.push(
                <StyledWord
                  key={`word-${segIdx}-${wordIdx}`}
                  word={word}
                  avgEnergy={avgEnergy}
                />
              );
              wordsWithPauses.push(
                <span key={`space-${segIdx}-${wordIdx}`}> </span>
              );
            });

            if (segIdx < segments.length - 1) {
              const nextSeg = segments[segIdx + 1];
              const segGap = nextSeg.start - seg.end;
              if (segGap > 0.5) {
                wordsWithPauses.push(
                  <PauseMarker
                    key={`seg-pause-${segIdx}`}
                    duration={segGap}
                  />
                );
              }
            }

            return (
              <span key={segIdx}>
                {wordsWithPauses}
              </span>
            );
          })}
        </div>

        {lowConfidenceWords.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display font-black text-sm uppercase tracking-[0.15em] text-[#888] mb-4">
              Low-Confidence Words
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowConfidenceWords
                .sort((a, b) => a.probability - b.probability)
                .map((word, i) => (
                  <button
                    key={i}
                    onClick={() => handleJumpToTimeline(word.start)}
                    className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-red-500/50 rounded-lg p-3 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-red-400">
                        "{word.word}"
                      </span>
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: getConfidenceColor(word.probability) }}
                      >
                        {Math.round(word.probability * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#666]">
                        at {word.start.toFixed(2)}s
                      </span>
                      <span className="text-[10px] text-[#555] group-hover:text-red-400 transition-colors">
                        Jump to timeline →
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
