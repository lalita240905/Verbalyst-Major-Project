import { CoachingInsight } from "@/lib/analysis";
import { Clock, Activity, Mic, Eye, Pause, ThumbsUp } from "lucide-react";

const iconMap = {
  pacing: Clock,
  monotone: Activity,
  energy: Mic,
  clarity: Eye,
  pause: Pause,
  positive: ThumbsUp,
};

const iconColorMap: Record<string, string> = {
  pacing: "#f59e0b",
  monotone: "#a78bfa",
  energy: "#f97316",
  clarity: "#ef4444",
  pause: "#6b7280",
  positive: "#22c55e",
};

interface CoachingPanelProps {
  insights: CoachingInsight[];
}

export default function CoachingPanel({ insights }: CoachingPanelProps) {
  return (
    <section id="zone-coaching" className="mb-12">
      <div className="mb-6">
        <h2 className="font-display font-black text-xl text-white">
          Coaching Insights
        </h2>
        <p className="text-xs text-[#666] mt-1">
          Specific, actionable advice derived from your speech data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => {
          const Icon = iconMap[insight.icon] || Activity;
          const iconColor = iconColorMap[insight.icon] || "#888";

          return (
            <div
              key={insight.id}
              className="bg-[#111] border border-[#222] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#333] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${iconColor}15` }}
                >
                  <Icon
                    className="w-5 h-5"
                    style={{ color: iconColor }}
                    strokeWidth={2.5}
                  />
                </div>
                <h3 className="font-display font-black text-sm text-white leading-tight pt-2">
                  {insight.title}
                </h3>
              </div>

              <p className="text-[13px] leading-relaxed text-[#999]">
                {insight.body}
              </p>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#555] mb-2">
                  What to do
                </p>
                <p className="text-[12px] leading-relaxed text-[#bbb]">
                  {insight.fix}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
