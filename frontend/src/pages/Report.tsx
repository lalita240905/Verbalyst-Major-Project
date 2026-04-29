import { useMemo, useState, useEffect } from "react";
import { analyzeData, FusedSegment } from "@/lib/analysis";
import { loadAnalysisData } from "@/lib/api";
import sampleData from "@/lib/sampleData.json";
import ScoreHeader from "@/components/analysis/ScoreHeader";
import Timeline from "@/components/analysis/Timeline";
import Transcript from "@/components/analysis/Transcript";
import CoachingPanel from "@/components/analysis/CoachingPanel";
import { useNavigate } from "react-router-dom";

const Report = () => {
  const navigate = useNavigate();
  const [dataSource, setDataSource] = useState<"live" | "sample">("sample");

  const fusedData = useMemo((): FusedSegment[] => {
    const liveData = loadAnalysisData();
    if (liveData && liveData.length > 0) {
      setDataSource("live");
      return liveData;
    }
    setDataSource("sample");
    return sampleData as FusedSegment[];
  }, []);

  const analysis = useMemo(() => analyzeData(fusedData), [fusedData]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <header className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a
            href="/dashboard"
            className="font-display font-black text-lg text-white hover:text-[#ccc] transition-colors"
          >
            Verbalyst
          </a>
          <div className="flex items-center gap-4">
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
            <span className="text-xs font-mono text-[#555]">
              Speech Analysis Report
            </span>
          </div>
        </div>
      </header>

      {dataSource === "sample" && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-[#999]">
              Viewing sample data. Upload an audio file to see your own analysis.
            </p>
            <button
              onClick={() => navigate("/record")}
              className="px-4 py-2 bg-white text-black text-xs font-black uppercase tracking-wider rounded-lg hover:bg-[#ddd] transition-colors"
            >
              Analyze Your Speech →
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-10">
        <ScoreHeader
          scores={analysis.scores}
          verdict={analysis.verdict}
          descriptions={analysis.scoreDescriptions}
          totalDuration={analysis.totalDuration}
        />

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
          lowConfidenceWords={analysis.lowConfidenceWords}
        />

        <CoachingPanel insights={analysis.insights} />

        <footer className="text-center py-8 border-t border-[#1a1a1a]">
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-mono text-[#444] uppercase tracking-[0.2em]">
              Analysis powered by Whisper + Librosa • Verbalyst SFE Pipeline
            </p>
            <button
              onClick={() => navigate("/record")}
              className="px-6 py-3 bg-[#1a1a1a] border border-[#333] text-sm font-bold text-[#aaa] rounded-lg hover:bg-[#222] hover:text-white transition-colors"
            >
              Analyze Another Speech
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Report;
