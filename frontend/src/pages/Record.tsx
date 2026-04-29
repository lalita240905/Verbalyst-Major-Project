import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, Square, Upload, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { processAudio, storeAnalysisData } from "@/lib/api";

const WaveBar = ({ delay }: { delay: string }) => (
  <div
    className="w-1.5 bg-foreground rounded-full animate-wave"
    style={{ animationDelay: delay, height: "8px" }}
  />
);

const Record = () => {
  const [state, setState] = useState<"idle" | "recording" | "uploading" | "analyzing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const handleRecord = async () => {
    if (state === "idle") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "recording.webm", { type: "audio/webm" });
          await handleFileUpload(file);
        };

        mediaRecorder.start();
        setState("recording");
      } catch {
        setErrorMsg("Microphone access denied. Please allow microphone permissions and try again.");
        setState("error");
      }
    } else if (state === "recording") {
      mediaRecorderRef.current?.stop();
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setState("uploading");
    setErrorMsg("");

    try {
      const response = await processAudio(file);
      storeAnalysisData(response.fused, {
        analysis_id: response.analysis_id,
        filename: response.filename,
        audio_url: response.audio_url,
        language: response.language,
        processing_time: response.processing_time,
        total_pipeline_time: response.total_pipeline_time,
      });
      setState("analyzing");
      setTimeout(() => navigate("/report"), 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
      setState("error");
    }
  };

  const handleRetry = () => {
    setState("idle");
    setErrorMsg("");
    setUploadedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        {state === "idle" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
              Start Recording
            </h1>
            <p className="text-muted-foreground mb-10 max-w-md animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
              Tap the mic to start speaking or upload an existing audio file for analysis.
            </p>
          </>
        )}

        {state === "recording" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-destructive">
              Listening…
            </h1>
            <div className="flex items-end gap-1.5 mb-10 h-10">
              {[...Array(12)].map((_, i) => (
                <WaveBar key={i} delay={`${i * 0.1}s`} />
              ))}
            </div>
          </>
        )}

        {state === "uploading" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-primary">
              Processing…
            </h1>
            <div className="flex items-end gap-1.5 mb-6 h-10">
              {[...Array(12)].map((_, i) => (
                <WaveBar key={i} delay={`${i * 0.1}s`} />
              ))}
            </div>
            <p className="text-muted-foreground text-sm mb-2">
              Sending <span className="font-bold">{uploadedFileName}</span> to the GPU pipeline
            </p>
            <p className="text-muted-foreground/60 text-xs">
              This may take a moment — the audio is being transcribed and analyzed on the GPU…
            </p>
          </>
        )}

        {state === "analyzing" && (
          <>
            <h1 className="font-display text-4xl md:text-5xl font-black mb-4 text-primary animate-pulse">
              Analyzing your speech…
            </h1>
            <div className="flex items-end gap-1.5 mb-10 h-10 opacity-50">
              {[...Array(12)].map((_, i) => (
                <WaveBar key={i} delay={`${i * 0.1}s`} />
              ))}
            </div>
            <p className="text-muted-foreground">Building your report</p>
          </>
        )}

        {state === "error" && (
          <>
            <div className="brutal-card bg-destructive/10 border-destructive p-8 rounded-xl max-w-md mb-8">
              <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
              <h2 className="font-display text-xl font-black text-destructive mb-2">
                Analysis Failed
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMsg}
              </p>
              <button
                onClick={handleRetry}
                className="brutal-btn bg-foreground text-background px-6 py-2 text-sm"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {(state === "idle" || state === "recording") && (
          <div className="flex flex-col items-center gap-8">
            <button
              onClick={handleRecord}
              className={`brutal-btn rounded-full w-32 h-32 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 ${
                state === "recording"
                  ? "bg-destructive text-destructive-foreground animate-pulse-record shadow-none"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {state === "recording" ? (
                <Square className="w-10 h-10" fill="currentColor" />
              ) : (
                <Mic className="w-12 h-12" strokeWidth={2.5} />
              )}
            </button>

            {state === "idle" && (
              <div className="w-full flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="relative w-64 flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/20" />
                  </div>
                  <div className="relative px-4 bg-background text-xs text-muted-foreground uppercase tracking-[0.2em] font-black">
                    Or
                  </div>
                </div>

                <label className="cursor-pointer group">
                  <div className="brutal-card bg-secondary hover:bg-secondary/80 transition-all p-5 flex items-center gap-4 w-72 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border-2 border-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-sm uppercase">Upload Audio</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic">MP3, WAV, or M4A supported</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        {state === "recording" && (
          <p className="mt-6 text-sm font-black uppercase tracking-widest text-muted-foreground animate-bounce">
            Tap to stop
          </p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Record;
