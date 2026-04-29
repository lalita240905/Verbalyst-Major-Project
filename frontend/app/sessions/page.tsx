"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSessions, deleteSession, SessionSummary, formatDate, formatDuration } from "@/lib/api";

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 0.001);
  const w = 80, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke="var(--volt)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
    </svg>
  );
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions().then(setSessions).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await deleteSession(id);
      setSessions((s) => s.filter((x) => x._id !== id));
    } catch { }
    setDeleting(null);
  };

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: "var(--volt)" }}>History</p>
          <h1 className="font-display text-4xl font-700 text-cream tracking-tight">Past Sessions</h1>
        </div>
        <button onClick={() => router.push("/")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-display font-600 text-sm transition-all hover:opacity-90"
          style={{ background: "var(--volt)", color: "#0a0a0f" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          New Analysis
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--ink-soft)" }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-24" style={{ border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 20 }}>
          <div className="text-5xl mb-4">🎙️</div>
          <p className="font-display font-600 text-xl text-cream mb-2">No sessions yet</p>
          <p className="text-cream-dim font-body text-sm">Upload an audio file to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sessions.map((s) => (
            <div key={s._id}
              onClick={() => router.push(`/sessions/${s._id}`)}
              className="segment-row p-6 cursor-pointer flex items-center gap-6 group">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "rgba(200,241,53,0.08)", border: "1px solid rgba(200,241,53,0.15)" }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="6" width="2" height="8" rx="1" fill="var(--volt)" opacity="0.5" />
                  <rect x="7" y="3" width="2" height="14" rx="1" fill="var(--volt)" />
                  <rect x="11" y="5" width="2" height="10" rx="1" fill="var(--volt)" opacity="0.7" />
                  <rect x="15" y="7" width="2" height="6" rx="1" fill="var(--volt)" opacity="0.4" />
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-display font-600 text-cream truncate group-hover:text-volt transition-colors">
                  {s.filename}
                </p>
                <p className="text-cream-dim text-xs font-mono mt-1">{formatDate(s.created_at)}</p>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-8 text-right">
                <div>
                  <p className="text-cream font-mono text-sm font-500">{formatDuration(s.duration || 0)}</p>
                  <p className="text-cream-dim text-xs">duration</p>
                </div>
                <div>
                  <p className="text-cream font-mono text-sm font-500">{s.word_count || 0}</p>
                  <p className="text-cream-dim text-xs">words</p>
                </div>
                <div>
                  <p className="font-mono text-sm font-500 uppercase" style={{ color: "var(--wave)" }}>
                    {s.language?.toUpperCase() || "–"}
                  </p>
                  <p className="text-cream-dim text-xs">language</p>
                </div>
                <div className="flex items-end">
                  <Sparkline data={s.energy_sparkline || []} />
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={(e) => handleDelete(e, s._id)}
                disabled={deleting === s._id}
                className="ml-4 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.2)" }}>
                {deleting === s._id ? (
                  <div className="w-4 h-4 border-2 border-signal border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3.5 3.5l.5 8a.5.5 0 00.5.5h5a.5.5 0 00.5-.5l.5-8"
                      stroke="var(--signal)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {/* Arrow */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-cream-dim group-hover:text-volt transition-colors">
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
