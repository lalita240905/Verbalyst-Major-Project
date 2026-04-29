import { ScoreBreakdown } from "@/lib/analysis";

interface ScoreHeaderProps {
  scores: ScoreBreakdown;
  verdict: string;
  descriptions: {
    energy: string;
    pacing: string;
    expressiveness: string;
  };
  totalDuration: number;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

function ScoreRing({ score, size = 180 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-black text-6xl leading-none"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#a0a0a0] mt-1">
          / 100
        </span>
      </div>
    </div>
  );
}

function ScoreTile({
  label,
  score,
  description,
}: {
  label: string;
  score: number;
  description: string;
}) {
  const color = getScoreColor(score);
  const percentage = Math.round(score);

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] font-black text-[#888]">
          {label}
        </span>
        <span
          className="font-display font-black text-xl"
          style={{ color }}
        >
          {percentage}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-[#2a2a2a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-[11px] leading-relaxed text-[#999]">{description}</p>
    </div>
  );
}

export default function ScoreHeader({
  scores,
  verdict,
  descriptions,
  totalDuration,
}: ScoreHeaderProps) {
  const isTooShort = totalDuration < 10;

  return (
    <section id="zone-score-header" className="mb-12">
      {isTooShort && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-xl p-4 mb-6 text-center">
          <p className="text-yellow-400 text-sm font-bold">
            ⚠ Short speech detected ({totalDuration.toFixed(1)}s). Some metrics may be unreliable — aim for 30+ seconds for meaningful analysis.
          </p>
        </div>
      )}

      <div className="bg-[#111] border border-[#222] rounded-2xl p-8 md:p-12">
        <div className="flex flex-col items-center mb-10">
          <p className="text-xs uppercase tracking-[0.25em] font-black text-[#666] mb-6">
            Delivery Score
          </p>
          <ScoreRing score={scores.overall} />
          <p className="mt-6 text-lg font-display font-bold text-[#ccc] text-center max-w-lg">
            {verdict}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ScoreTile label="Energy" score={scores.energy} description={descriptions.energy} />
          <ScoreTile label="Pacing" score={scores.pacing} description={descriptions.pacing} />
          <ScoreTile label="Expressiveness" score={scores.expressiveness} description={descriptions.expressiveness} />
        </div>
      </div>
    </section>
  );
}
