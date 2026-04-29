import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, Calendar, Clock, Globe, Play, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchAnalyses, AnalysisSummary } from "@/lib/api";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalyses()
      .then((data) => {
        setAnalyses(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalSessions = analyses.length;
  const latestLanguage = analyses.length > 0 ? analyses[0].language : null;

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="brutal-card bg-primary text-primary-foreground p-8 md:p-10 rounded-xl mb-8">
          <p className="font-display text-sm font-semibold uppercase tracking-wider mb-2">Welcome Back</p>
          <h1 className="font-display text-4xl md:text-5xl font-black mb-4">Your Speech Lab.</h1>
          <div className="flex items-center gap-6 mt-4">
            <div>
              <span className="font-display text-6xl md:text-7xl font-black leading-none">{totalSessions}</span>
              <p className="text-sm mt-1 text-primary-foreground/70">
                {totalSessions === 1 ? "Session" : "Sessions"} Recorded
              </p>
            </div>
            {latestLanguage && (
              <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-bold uppercase">{latestLanguage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => navigate("/record")}
            className="brutal-card bg-coral p-6 rounded-lg text-left hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group"
          >
            <Mic className="w-8 h-8 mb-3" strokeWidth={2.5} />
            <p className="font-display text-xl font-black mb-1">New Recording</p>
            <p className="text-sm text-foreground/70">Record or upload audio for analysis</p>
            <ArrowRight className="w-5 h-5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <div className="brutal-card bg-mint p-6 rounded-lg">
            <Calendar className="w-8 h-8 mb-3" strokeWidth={2.5} />
            <p className="font-display text-xl font-black mb-1">Sessions</p>
            <p className="font-display text-4xl font-black">{totalSessions}</p>
          </div>

          <div className="brutal-card bg-secondary p-6 rounded-lg">
            <Clock className="w-8 h-8 mb-3" strokeWidth={2.5} />
            <p className="font-display text-xl font-black mb-1">Last Session</p>
            <p className="text-sm font-semibold">
              {analyses.length > 0 ? formatDate(analyses[0].created_at) : "No sessions yet"}
            </p>
          </div>
        </div>

        <h2 className="font-display text-2xl font-black mb-4">Previous Analyses</h2>

        {loading && (
          <div className="brutal-card bg-card p-10 rounded-lg flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold text-muted-foreground">Loading analyses…</span>
          </div>
        )}

        {error && (
          <div className="brutal-card bg-destructive/10 border-destructive p-6 rounded-lg mb-4">
            <p className="text-sm text-destructive font-bold">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">Make sure the backend is running on port 8000</p>
          </div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div className="brutal-card bg-card p-10 rounded-lg text-center">
            <Mic className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
            <p className="font-display text-lg font-black mb-2">No analyses yet</p>
            <p className="text-sm text-muted-foreground mb-4">Record or upload your first audio to get started</p>
            <button
              onClick={() => navigate("/record")}
              className="brutal-btn bg-primary text-primary-foreground text-sm rounded-lg"
            >
              Start Recording
            </button>
          </div>
        )}

        {!loading && analyses.length > 0 && (
          <div className="space-y-3">
            {analyses.map((a) => (
              <button
                key={a._id}
                onClick={() => navigate(`/report/${a._id}`)}
                className="brutal-card bg-card p-5 rounded-lg flex items-center justify-between w-full text-left hover:translate-x-1 transition-transform group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  {a.audio_url ? (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Play className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Mic className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{a.filename || "Untitled"}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
                      {a.language && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                          {a.language}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {a.total_pipeline_time && (
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatDuration(a.total_pipeline_time)}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
