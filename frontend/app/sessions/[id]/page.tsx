"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchSession, SessionDetail, formatDate, formatDuration } from "@/lib/api";
import TranscriptHeatmap from "@/components/TranscriptHeatmap";
import AcousticsTimeline from "@/components/AcousticsTimeline";
import SegmentPanel from "@/components/SegmentPanel";
import StatsCards from "@/components/StatsCards";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"heatmap" | "timeline" | "segments">("heatmap");

  useEffect(() => {
    if (!id) return;
    fetchSession(id).then(setSession).catch(() => router.push("/sessions")).finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "var(--ink-soft)" }} />
          ))}
        </div>
      </main>
    );
  }

  if (!session) return null;

  const tabs = [
    { key: "heatmap", label: "Word Heatmap" },
    { key: "timeline", label: "Acoustic Timeline" },
    { key: "segments", label: "Segments" },
  ] as const;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <button onClick={() => router.push("/sessions")}
            className="flex items-center gap-2 text-cream-dim hover:text-cream transition-colors text-sm font-body mb-4">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All Sessions
          </button>
          <h1 className="font-display text-3xl font-700 text-cream tracking-tight mb-1">
            {session.filename}
          </h1>
          <p className="text-cream-dim text-sm font-mono">{formatDate(session.created_at)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 rounded-xl font-mono text-sm" style={{ background: "rgba(77,240,200,0.1)", border: "1px solid rgba(77,240,200,0.2)", color: "var(--wave)" }}>
            {session.language?.toUpperCase()} · {Math.round((session.language_probability || 0) * 100)}%
          </div>
          <div className="px-4 py-2 rounded-xl font-mono text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--cream-dim)" }}>
            {formatDuration(session.duration || 0)} audio
          </div>
          <div className="px-4 py-2 rounded-xl font-mono text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--cream-dim)" }}>
            {(session.total_pipeline_time || 0).toFixed(1)}s pipeline
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards session={session} />

      {/* Tab nav */}
      <div className="flex gap-1 mt-10 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "var(--ink-soft)", border: "1px solid var(--ink-border)" }}>
        {tabs.map((t) => (
          <button key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="px-5 py-2 rounded-lg font-display font-600 text-sm transition-all"
            style={{
              background: activeTab === t.key ? "rgba(200,241,53,0.12)" : "transparent",
              color: activeTab === t.key ? "var(--volt)" : "var(--cream-dim)",
              border: activeTab === t.key ? "1px solid rgba(200,241,53,0.25)" : "1px solid transparent",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "heatmap" && <TranscriptHeatmap fused={session.fused} />}
        {activeTab === "timeline" && <AcousticsTimeline acoustics={session.acoustics} fused={session.fused} />}
        {activeTab === "segments" && <SegmentPanel fused={session.fused} />}
      </div>
    </main>
  );
}
