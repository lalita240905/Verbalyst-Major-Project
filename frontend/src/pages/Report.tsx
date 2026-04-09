import DashboardLayout from "@/components/DashboardLayout";
import { Zap, Clock, AlertTriangle, BarChart2, FileText, MessageSquare, ThumbsUp, AlertCircle, Bot } from "lucide-react";

const articulationMetrics = [
  { icon: Clock, label: "Speech Rate", value: "145 wpm", note: "Slightly fast", color: "bg-primary text-primary-foreground" },
  { icon: Zap, label: "Pauses", value: "12", note: "Good rhythm", color: "bg-mint" },
  { icon: AlertTriangle, label: "Filler Words", value: "4", note: "Below average", color: "bg-secondary" },
  { icon: BarChart2, label: "Pitch Variation", value: "Medium", note: "Add more range", color: "bg-coral" },
];

const scriptMetrics = [
  { icon: FileText, label: "Structure", value: "Strong", color: "bg-secondary" },
  { icon: MessageSquare, label: "Coherence", value: "82%", color: "bg-mint" },
  { icon: Zap, label: "Engagement", value: "High", color: "bg-primary text-primary-foreground" },
];

const strengths = [
  "Clear opening statement with strong hook",
  "Good use of transitions between points",
  "Confident closing with call to action",
];

const improvements = [
  "Slow down during key arguments",
  "Add pauses after rhetorical questions",
  "Reduce use of 'basically' and 'like'",
];

const Report = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Summary */}
        <div className="brutal-card bg-primary text-primary-foreground p-8 md:p-10 rounded-xl mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-80">Analysis Summary</p>
          <h1 className="font-display text-3xl md:text-4xl font-black">
            Clear speech, but pacing is too fast.
          </h1>
        </div>

        {/* Articulation */}
        <h2 className="font-display text-2xl font-bold mb-4">Articulation Analysis</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {articulationMetrics.map((m) => (
            <div key={m.label} className={`brutal-card p-5 rounded-lg ${m.color}`}>
              <m.icon className="w-5 h-5 mb-2" strokeWidth={2.5} />
              <p className="text-xs font-semibold uppercase">{m.label}</p>
              <p className="font-display text-2xl font-black">{m.value}</p>
              <p className="text-xs mt-1 opacity-80">{m.note}</p>
            </div>
          ))}
        </div>

        {/* Script Analysis */}
        <h2 className="font-display text-2xl font-bold mb-4">Script Analysis</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {scriptMetrics.map((m) => (
            <div key={m.label} className={`brutal-card p-5 rounded-lg ${m.color}`}>
              <m.icon className="w-5 h-5 mb-2" strokeWidth={2.5} />
              <p className="text-xs font-semibold uppercase">{m.label}</p>
              <p className="font-display text-2xl font-black">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div className="brutal-card bg-mint p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <ThumbsUp className="w-5 h-5" strokeWidth={2.5} />
              <h3 className="font-display text-lg font-bold">Strengths</h3>
            </div>
            <ul className="space-y-3">
              {strengths.map((s, i) => (
                <li key={i} className="text-sm font-medium flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-foreground flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="brutal-card bg-coral p-6 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
              <h3 className="font-display text-lg font-bold">Areas to Improve</h3>
            </div>
            <ul className="space-y-3">
              {improvements.map((s, i) => (
                <li key={i} className="text-sm font-medium flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-foreground flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* AI Summary */}
        <div className="brutal-card bg-secondary p-6 rounded-lg rotate-[-0.3deg]">
          <div className="flex items-start gap-3">
            <Bot className="w-6 h-6 mt-1 flex-shrink-0" strokeWidth={2.5} />
            <div>
              <h3 className="font-display text-lg font-bold mb-1">AI Summary</h3>
              <p className="text-sm leading-relaxed">
                Strong content structure and confident delivery. Focus on slowing your pace during key arguments and reducing filler words. 
                Your pitch variation has improved — keep experimenting with vocal dynamics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Report;
