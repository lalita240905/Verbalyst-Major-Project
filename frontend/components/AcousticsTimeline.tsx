"use client";
import { useMemo } from "react";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { AcousticWindow, FusedSegment } from "@/lib/api";

interface Props {
  acoustics: AcousticWindow[];
  fused: FusedSegment[];
}

const CustomTooltip = ({ active, payload, label }: {active?: boolean, payload?: {name: string, value: number, color: string}[], label?: number}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-4 text-xs font-mono"
      style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.12)" }}>
      <p className="text-cream-dim mb-2">{typeof label === 'number' ? label.toFixed(1) : label}s</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-6">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-cream">{typeof p.value === 'number' ? p.value.toFixed(4) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AcousticsTimeline({ acoustics, fused }: Props) {
  const chartData = useMemo(() =>
    acoustics.map((w) => ({
      time: w.window_start,
      rms: w.rms_energy,
      pitch: w.mean_pitch_hz / 1000, // normalize for dual axis display
      pitchRaw: w.mean_pitch_hz,
      pitchVar: w.pitch_variance / 10000,
      isPause: w.is_pause,
    })),
    [acoustics]
  );

  const segmentBoundaries = useMemo(() =>
    fused.map((s) => s.start),
    [fused]
  );

  return (
    <div className="space-y-6">
      {/* RMS Energy chart */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-600 text-cream text-lg">RMS Energy</h3>
            <p className="text-cream-dim text-xs font-mono mt-1">Loudness over time — each 500ms window</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "var(--volt)" }}>
            <div className="w-8 h-0.5 rounded" style={{ background: "var(--volt)" }} />
            RMS Energy
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="rmsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c8f135" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#c8f135" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#4a4a6a" tick={{ fill: "#6b6b8a", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) => `${v}s`} />
            <YAxis stroke="#4a4a6a" tick={{ fill: "#6b6b8a", fontSize: 10, fontFamily: "JetBrains Mono" }} width={60} />
            <Tooltip content={<CustomTooltip />} />
            {segmentBoundaries.map((t, i) => (
              <ReferenceLine key={i} x={t} stroke="rgba(77,240,200,0.3)" strokeDasharray="4 4" />
            ))}
            <Area type="monotone" dataKey="rms" name="RMS Energy" stroke="#c8f135" strokeWidth={2}
              fill="url(#rmsGrad)" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-xs font-mono mt-2" style={{ color: "rgba(77,240,200,0.5)" }}>
          ╌ Vertical dashed lines = segment boundaries
        </p>
      </div>

      {/* Pitch chart */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-600 text-cream text-lg">Mean Pitch (Hz)</h3>
            <p className="text-cream-dim text-xs font-mono mt-1">Fundamental frequency — voiced frames only</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2" style={{ color: "var(--wave)" }}>
              <div className="w-8 h-0.5 rounded" style={{ background: "var(--wave)" }} />
              Pitch Hz
            </div>
            <div className="flex items-center gap-2" style={{ color: "var(--amber)" }}>
              <div className="w-8 h-0.5 rounded" style={{ background: "var(--amber)" }} />
              Pitch Variance
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
            <defs>
              <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4df0c8" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4df0c8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#4a4a6a" tick={{ fill: "#6b6b8a", fontSize: 10, fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) => `${v}s`} />
            <YAxis stroke="#4a4a6a" tick={{ fill: "#6b6b8a", fontSize: 10, fontFamily: "JetBrains Mono" }} width={60} />
            <Tooltip content={<CustomTooltip />} />
            {segmentBoundaries.map((t, i) => (
              <ReferenceLine key={i} x={t} stroke="rgba(77,240,200,0.3)" strokeDasharray="4 4" />
            ))}
            <Area type="monotone" dataKey="pitch" name="Pitch (×1000 Hz)" stroke="#4df0c8" strokeWidth={2}
              fill="url(#pitchGrad)" dot={false} />
            <Line type="monotone" dataKey="pitchVar" name="Pitch Variance (÷10000)" stroke="#ffb340"
              strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Pause map */}
      <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 className="font-display font-600 text-cream text-lg mb-2">Pause Map</h3>
        <p className="text-cream-dim text-xs font-mono mb-5">Windows where RMS energy &lt; 0.01 (silence threshold)</p>
        <div className="flex h-10 rounded-lg overflow-hidden w-full gap-px">
          {acoustics.map((w, i) => (
            <div key={i} className="flex-1 rounded-sm transition-all"
              title={`${w.window_start.toFixed(1)}s–${w.window_end.toFixed(1)}s`}
              style={{
                background: w.is_pause ? "rgba(255,179,64,0.5)" : "rgba(200,241,53,0.4)",
                minWidth: 2,
              }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-cream-dim">
          <span>0s</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: "rgba(200,241,53,0.4)" }} />
              <span>Voice</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: "rgba(255,179,64,0.5)" }} />
              <span>Pause</span>
            </div>
          </div>
          <span>{acoustics[acoustics.length - 1]?.window_end.toFixed(1) || 0}s</span>
        </div>
      </div>
    </div>
  );
}
