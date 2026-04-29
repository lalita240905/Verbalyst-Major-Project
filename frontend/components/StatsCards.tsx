"use client";
import { useMemo } from "react";
import { SessionDetail, formatDuration } from "@/lib/api";

interface Props {
  session: SessionDetail;
}

export default function StatsCards({ session }: Props) {
  const stats = useMemo(() => {
    const allWords = session.fused.flatMap((s) => s.words);
    if (!allWords.length) return null;

    const energies = allWords.map((w) => w.acoustics.rms_energy);
    const pitches = allWords.map((w) => w.acoustics.mean_pitch_hz).filter(Boolean);
    const pauses = allWords.filter((w) => w.acoustics.is_pause);

    const maxEnergyWord = allWords.reduce((a, b) => a.acoustics.rms_energy > b.acoustics.rms_energy ? a : b);
    const minEnergyWord = allWords.reduce((a, b) => a.acoustics.rms_energy < b.acoustics.rms_energy ? a : b);
    const avgPitch = pitches.length ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0;
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length;

    // Pitch trend: compare first vs last third
    const firstThird = allWords.slice(0, Math.floor(allWords.length / 3));
    const lastThird = allWords.slice(Math.floor(allWords.length * 2 / 3));
    const firstAvgPitch = firstThird.map((w) => w.acoustics.mean_pitch_hz).filter(Boolean);
    const lastAvgPitch = lastThird.map((w) => w.acoustics.mean_pitch_hz).filter(Boolean);
    const pitchTrend = firstAvgPitch.length && lastAvgPitch.length
      ? (lastAvgPitch.reduce((a, b) => a + b, 0) / lastAvgPitch.length) - (firstAvgPitch.reduce((a, b) => a + b, 0) / firstAvgPitch.length)
      : 0;

    return {
      avgEnergy,
      avgPitch,
      pauseCount: pauses.length,
      pausePct: Math.round((pauses.length / allWords.length) * 100),
      maxEnergyWord,
      minEnergyWord,
      pitchTrend,
      wordCount: allWords.length,
      segmentCount: session.fused.length,
    };
  }, [session]);

  if (!stats) return null;

  const cards = [
    {
      label: "Total Words",
      value: stats.wordCount.toString(),
      sub: `${stats.segmentCount} segments`,
      color: "var(--volt)",
      bg: "rgba(200,241,53,0.05)",
      border: "rgba(200,241,53,0.15)",
    },
    {
      label: "Duration",
      value: formatDuration(session.duration || 0),
      sub: `${(session.total_pipeline_time || 0).toFixed(1)}s pipeline`,
      color: "var(--wave)",
      bg: "rgba(77,240,200,0.05)",
      border: "rgba(77,240,200,0.15)",
    },
    {
      label: "Avg. Energy",
      value: stats.avgEnergy.toFixed(4),
      sub: `Peak: "${stats.maxEnergyWord.word}"`,
      color: "var(--volt)",
      bg: "rgba(200,241,53,0.05)",
      border: "rgba(200,241,53,0.15)",
    },
    {
      label: "Avg. Pitch",
      value: `${stats.avgPitch.toFixed(0)} Hz`,
      sub: stats.pitchTrend > 5 ? "↗ Rising trend" : stats.pitchTrend < -5 ? "↘ Falling trend" : "→ Stable",
      color: stats.pitchTrend > 5 ? "var(--volt)" : stats.pitchTrend < -5 ? "var(--signal)" : "var(--wave)",
      bg: "rgba(77,240,200,0.05)",
      border: "rgba(77,240,200,0.15)",
    },
    {
      label: "Pauses Detected",
      value: `${stats.pauseCount}`,
      sub: `${stats.pausePct}% of words`,
      color: "var(--amber)",
      bg: "rgba(255,179,64,0.05)",
      border: "rgba(255,179,64,0.15)",
    },
    {
      label: "Lowest Energy",
      value: `"${stats.minEnergyWord.word}"`,
      sub: `${stats.minEnergyWord.acoustics.rms_energy.toFixed(5)} RMS`,
      color: "var(--signal)",
      bg: "rgba(255,77,109,0.05)",
      border: "rgba(255,77,109,0.15)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="stat-card flex flex-col gap-1"
          style={{ background: card.bg, borderColor: card.border }}>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: card.color, opacity: 0.8 }}>
            {card.label}
          </p>
          <p className="font-display font-700 text-cream text-lg leading-tight truncate" title={card.value}>
            {card.value}
          </p>
          <p className="font-mono text-xs text-cream-dim mt-auto">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
