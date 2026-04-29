import { useMemo, useState, useEffect } from "react";
import { analyzeData, FusedSegment } from "@/lib/analysis";
import { loadAnalysisData, loadAnalysisMeta, fetchAnalysis } from "@/lib/api";
import sampleData from "@/lib/sampleData.json";
import ScoreHeader from "@/components/analysis/ScoreHeader";
import Timeline from "@/components/analysis/Timeline";
import Transcript from "@/components/analysis/Transcript";
import CoachingPanel from "@/components/analysis/CoachingPanel";
import DashboardLayout from "@/components/DashboardLayout";
import { useNavigate, useParams } from "react-router-dom";

const Report = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [dataSource, setDataSource] = useState<"live" | "sample" | "saved">("sample");
  const [fusedData, setFusedData] = useState<FusedSegment[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [pipelineTime, setPipelineTime] = useState<number>(0);
  const [language, setLanguage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        try {
          const doc = await fetchAnalysis(id);
          setFusedData(doc.fused);
          setAudioUrl(doc.audio_url);
          setFilename(doc.filename);
          setPipelineTime(doc.total_pipeline_time);
          setLanguage(doc.language);
          setDataSource("saved");
        } catch {
          setFusedData(sampleData as FusedSegment[]);
          setDataSource("sample");
        }
      } else {
        const liveData = loadAnalysisData();
        const meta = loadAnalysisMeta();
        if (liveData && liveData.length > 0) {
          setFusedData(liveData);
          setAudioUrl(meta?.audio_url || null);
          setFilename(meta?.filename || "");
          setPipelineTime(meta?.total_pipeline_time || 0);
          setLanguage(meta?.language || "");
          setDataSource("live");
        } else {
          setFusedData(sampleData as FusedSegment[]);
          setDataSource("sample");
        }
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const analysis = useMemo(() => {
    if (fusedData.length === 0) return null;
    return analyzeData(fusedData);
  }, [fusedData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-wider">Loading analysis…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!analysis) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">No analysis data found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-black mb-1">
              Speech Report
            </h1>
            <div className="flex items-center gap-3 mt-2">
              {dataSource === "sample" && (
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-800/50">
                  SAMPLE DATA
                </span>
              )}
              {dataSource === "live" && (
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-green-900/30 text-green-500 border border-green-800/50">
                  LIVE ANALYSIS
                </span>
              )}
              {dataSource === "saved" && (
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-800/50">
                  SAVED REPORT
                </span>
              )}
              {language && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {language.toUpperCase()}
                </span>
              )}
              {pipelineTime > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {pipelineTime}s pipeline
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate("/record")}
            className="brutal-btn bg-primary text-primary-foreground text-sm rounded-lg"
          >
            New Analysis
          </button>
        </div>

        {dataSource === "sample" && (
          <div className="brutal-card bg-secondary p-6 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm">
              This is sample data. Upload or record audio to see your own analysis.
            </p>
            <button
              onClick={() => navigate("/record")}
              className="brutal-btn bg-foreground text-background text-xs rounded-lg whitespace-nowrap"
            >
              Analyze Your Speech →
            </button>
          </div>
        )}

        {audioUrl && (
          <div className="brutal-card bg-card p-6 rounded-xl mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-black text-sm uppercase tracking-wider text-muted-foreground">
                Your Recording
              </h2>
              {filename && (
                <span className="text-xs font-mono text-muted-foreground">{filename}</span>
              )}
            </div>
            <audio
              controls
              src={audioUrl}
              className="w-full h-12"
              style={{ borderRadius: "8px" }}
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        <div className="[&_section]:mb-8 [&_section>div]:bg-card [&_section>div]:border-foreground/10 [&_section>div]:brutal-border">
          <ScoreHeader
            scores={analysis.scores}
            verdict={analysis.verdict}
            descriptions={analysis.scoreDescriptions}
            totalDuration={analysis.totalDuration}
          />
        </div>

        <div className="brutal-card bg-card rounded-xl p-6 md:p-8 mb-8">
          <div className="flex items-center gap-6 mb-0">
            <div className="text-center">
              <p className="font-display text-3xl font-black">{analysis.wpm}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase">WPM</p>
            </div>
            <div className="h-10 w-px bg-foreground/10" />
            <div className="text-center">
              <p className="font-display text-3xl font-black">{analysis.totalDuration.toFixed(1)}s</p>
              <p className="text-xs text-muted-foreground font-bold uppercase">Duration</p>
            </div>
            <div className="h-10 w-px bg-foreground/10" />
            <div className="text-center">
              <p className="font-display text-3xl font-black">{analysis.allWords.length}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase">Words</p>
            </div>
            <div className="h-10 w-px bg-foreground/10" />
            <div className="text-center">
              <p className="font-display text-3xl font-black">{Math.round(analysis.avgPitch)}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase">Avg Pitch Hz</p>
            </div>
          </div>
        </div>

        <Timeline
          segments={analysis.segments}
          allWords={analysis.allWords}
          avgPitch={analysis.avgPitch}
          avgEnergy={analysis.avgEnergy}
          totalDuration={analysis.totalDuration}
        />

        <Transcript
          segments={analysis.segments}
          allWords={analysis.allWords}
          avgEnergy={analysis.avgEnergy}
        />

        <CoachingPanel insights={analysis.insights} />

        <div className="text-center py-8 border-t border-foreground/10">
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
              Analysis powered by Whisper + Librosa • Verbalyst SFE Pipeline
            </p>
            <button
              onClick={() => navigate("/record")}
              className="brutal-btn bg-card text-foreground text-sm rounded-lg"
            >
              Analyze Another Speech
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Report;
