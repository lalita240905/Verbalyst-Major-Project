import { useRef, useCallback } from "react";
import { FusedSegment, FusedWord } from "@/lib/analysis";

interface TranscriptProps {
  segments: FusedSegment[];
  allWords: FusedWord[];
  avgEnergy: number;
}

function StyledWord({
  word,
  avgEnergy,
}: {
  word: FusedWord;
  avgEnergy: number;
}) {
  const isHighEnergy = word.acoustics.rms_energy > avgEnergy * 1.5;
  const isLowEnergy = word.acoustics.rms_energy < avgEnergy * 0.3;
  const isPauseWord = word.acoustics.is_pause && word.acoustics.rms_energy < 0.005;

  let className = "relative inline transition-colors duration-150 ";
  let style: React.CSSProperties = {};

  if (isPauseWord) {
    style.color = "#666";
  } else if (isHighEnergy) {
    className += "font-bold ";
    style.color = "#fff";
  } else if (isLowEnergy) {
    style.color = "#888";
  } else {
    style.color = "#ccc";
  }

  return (
    <span className="group relative inline">
      <span className={className} style={style}>
        {word.word}
      </span>
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
}: TranscriptProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  return (
    <section id="zone-transcript" className="mb-12">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
        <h2 className="font-display font-black text-xl text-white mb-1">
          Annotated Transcript
        </h2>
        <p className="text-xs text-[#666] mb-6">
          <span className="font-bold text-white">Bold</span> = emphasized &nbsp;
          <span className="text-[#888]">Dim</span> = soft &nbsp;
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
      </div>
    </section>
  );
}
