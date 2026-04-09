import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

const WaveBar = ({ delay }: { delay: string }) => (
  <div
    className="w-1.5 bg-foreground rounded-full animate-wave"
    style={{ animationDelay: delay, height: "8px" }}
  />
);

const Record = () => {
  const [state, setState] = useState<"idle" | "recording" | "analyzing">("idle");
  const navigate = useNavigate();

  const handleRecord = () => {
    if (state === "idle") {
      setState("recording");
    } else if (state === "recording") {
      setState("analyzing");
      setTimeout(() => navigate("/report"), 3000);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        {state === "idle" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4">Start Recording</h1>
            <p className="text-muted-foreground mb-10 max-w-md">
              Tap the mic and speak naturally. We'll analyze your clarity, pace, filler words, and more.
            </p>
          </>
        )}

        {state === "recording" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-destructive">Listening…</h1>
            <div className="flex items-end gap-1.5 mb-10 h-10">
              {[...Array(12)].map((_, i) => (
                <WaveBar key={i} delay={`${i * 0.1}s`} />
              ))}
            </div>
          </>
        )}

        {state === "analyzing" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-primary">Analyzing your speech…</h1>
            <div className="flex items-end gap-1.5 mb-10 h-10 opacity-50">
              {[...Array(12)].map((_, i) => (
                <WaveBar key={i} delay={`${i * 0.1}s`} />
              ))}
            </div>
            <p className="text-muted-foreground">AI is processing your recording</p>
          </>
        )}

        {state !== "analyzing" && (
          <button
            onClick={handleRecord}
            className={`brutal-btn rounded-full w-32 h-32 flex items-center justify-center ${
              state === "recording"
                ? "bg-destructive text-destructive-foreground animate-pulse-record"
                : "bg-primary text-primary-foreground"
            }`}
          >
            {state === "recording" ? (
              <Square className="w-10 h-10" fill="currentColor" />
            ) : (
              <Mic className="w-12 h-12" strokeWidth={2.5} />
            )}
          </button>
        )}

        {state === "recording" && (
          <p className="mt-6 text-sm font-semibold text-muted-foreground">Tap to stop recording</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Record;
