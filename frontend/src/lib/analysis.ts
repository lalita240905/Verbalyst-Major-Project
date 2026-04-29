export interface WordAcoustics {
  rms_energy: number;
  mean_pitch_hz: number;
  pitch_variance: number;
  is_pause: boolean;
}

export interface FusedWord {
  word: string;
  start: number;
  end: number;
  probability: number;
  acoustics: WordAcoustics;
}

export interface FusedSegment {
  start: number;
  end: number;
  text: string;
  acoustic_summary: WordAcoustics;
  words: FusedWord[];
}

export interface ScoreBreakdown {
  energy: number;
  pacing: number;
  expressiveness: number;
  overall: number;
}

export interface CoachingInsight {
  id: string;
  icon: "pacing" | "monotone" | "energy" | "pause" | "positive";
  title: string;
  body: string;
  fix: string;
}

export interface AnalysisResult {
  scores: ScoreBreakdown;
  verdict: string;
  scoreDescriptions: {
    energy: string;
    pacing: string;
    expressiveness: string;
  };
  insights: CoachingInsight[];
  allWords: FusedWord[];
  segments: FusedSegment[];
  totalDuration: number;
  avgPitch: number;
  avgEnergy: number;
  wpm: number;
  segmentWPMs: { segment: FusedSegment; wpm: number }[];
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function linearScale(val: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  const t = clamp((val - inMin) / (inMax - inMin), 0, 1);
  return outMin + t * (outMax - outMin);
}

export function analyzeData(segments: FusedSegment[]): AnalysisResult {
  const allWords: FusedWord[] = segments.flatMap((s) => s.words);
  const totalDuration =
    segments.length > 0
      ? segments[segments.length - 1].end - segments[0].start
      : 0;

  const energies = allWords.map((w) => w.acoustics.rms_energy).filter((e) => e > 0);
  const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;

  const pitches = allWords.map((w) => w.acoustics.mean_pitch_hz).filter((p) => p > 0);
  const avgPitch = pitches.length > 0 ? pitches.reduce((a, b) => a + b, 0) / pitches.length : 0;

  const segmentWPMs = segments.map((seg) => {
    const dur = seg.end - seg.start;
    const wordCount = seg.words.length;
    const wpm = dur > 0 ? (wordCount / dur) * 60 : 0;
    return { segment: seg, wpm: Math.round(wpm) };
  });

  const wpm = totalDuration > 0 ? Math.round((allWords.length / totalDuration) * 60) : 0;

  const energyScore = Math.round(linearScale(avgEnergy, 0.005, 0.025, 0, 100));

  const pacingScore = computePacingScore(wpm, segments, allWords);

  const segVariances = segments.map((s) => s.acoustic_summary.pitch_variance);
  const avgVariance =
    segVariances.length > 0
      ? segVariances.reduce((a, b) => a + b, 0) / segVariances.length
      : 0;
  const expressiveness = Math.round(linearScale(avgVariance, 50, 1000, 0, 100));

  const overall = Math.round(energyScore * 0.35 + pacingScore * 0.35 + expressiveness * 0.3);

  const scores: ScoreBreakdown = {
    energy: clamp(energyScore, 0, 100),
    pacing: clamp(pacingScore, 0, 100),
    expressiveness: clamp(expressiveness, 0, 100),
    overall: clamp(overall, 0, 100),
  };

  const scoreDescriptions = {
    energy: getEnergyDescription(scores.energy, avgEnergy, allWords),
    pacing: getPacingDescription(wpm),
    expressiveness: getExpressivenessDescription(scores.expressiveness),
  };

  const verdict = generateVerdict(scores);
  const insights = generateInsights(scores, segments, allWords, segmentWPMs, avgEnergy, avgPitch);

  return {
    scores,
    verdict,
    scoreDescriptions,
    insights,
    allWords,
    segments,
    totalDuration,
    avgPitch,
    avgEnergy,
    wpm,
    segmentWPMs,
  };
}

function computePacingScore(wpm: number, segments: FusedSegment[], allWords: FusedWord[]): number {
  let score = 100;

  if (wpm > 160) score -= Math.min(40, (wpm - 160) * 2);
  else if (wpm < 80) score -= Math.min(40, (80 - wpm) * 2);

  const pauses: number[] = [];
  for (let i = 1; i < allWords.length; i++) {
    const gap = allWords[i].start - allWords[i - 1].end;
    if (gap > 0.1) pauses.push(gap);
  }

  const hasStrategicPauses = pauses.some((p) => p >= 0.3 && p <= 2.0);
  if (!hasStrategicPauses && pauses.length > 0) score -= 15;

  const longPauses = pauses.filter((p) => p > 3.0);
  score -= longPauses.length * 10;

  return clamp(Math.round(score), 0, 100);
}

function getEnergyDescription(score: number, avgEnergy: number, allWords: FusedWord[]): string {
  const lowEnergyCount = allWords.filter((w) => w.acoustics.rms_energy < avgEnergy * 0.3).length;
  if (score >= 80) return "Strong, consistent vocal energy throughout. Your voice projects confidence.";
  if (score >= 50)
    return `Decent energy overall, but ${lowEnergyCount} words were spoken too softly — you may be trailing off.`;
  return "Your vocal energy is low for most of the speech. Speak from the diaphragm and maintain volume through the end of each sentence.";
}

function getPacingDescription(wpm: number): string {
  if (wpm > 160) return `At ${wpm} WPM, you're speaking too fast for your audience to absorb your points.`;
  if (wpm < 80) return `At ${wpm} WPM, your pace is very slow. This can signal hesitation or cause your audience to lose interest.`;
  if (wpm >= 120 && wpm <= 150) return `${wpm} WPM is within the ideal conversational range. Good pacing.`;
  return `${wpm} WPM — reasonable pace, with some room for adjustment in key moments.`;
}

function getExpressivenessDescription(score: number): string {
  if (score >= 75) return "Your pitch moves naturally — you sound expressive and engaging.";
  if (score >= 40) return "Some variation, but there are stretches where your voice goes flat. Add emphasis on key words.";
  return "Your delivery is monotone. Vary your pitch to highlight important ideas and keep your audience engaged.";
}

function generateVerdict(scores: ScoreBreakdown): string {
  const { overall, energy, pacing, expressiveness } = scores;
  const weakest = Math.min(energy, pacing, expressiveness);

  if (overall >= 80) {
    if (weakest === pacing) return "Strong delivery — tighten up your pacing for a perfect score.";
    if (weakest === expressiveness) return "Confident speaker — add more vocal variety to truly captivate.";
    return "Excellent delivery. You sound confident and expressive.";
  }
  if (overall >= 55) {
    if (weakest === energy) return "Decent speech, but your energy dips — project more in the second half.";
    if (weakest === pacing) return "Strong delivery, work on your pacing.";
    return "Monotone delivery — your audience may lose focus.";
  }
  return "Several areas need work. Focus on energy and pacing first, then expressiveness.";
}

function generateInsights(
  scores: ScoreBreakdown,
  segments: FusedSegment[],
  allWords: FusedWord[],
  segmentWPMs: { segment: FusedSegment; wpm: number }[],
  avgEnergy: number,
  avgPitch: number,
): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  const fastestSeg = segmentWPMs.reduce((a, b) => (a.wpm > b.wpm ? a : b), segmentWPMs[0]);
  const slowestSeg = segmentWPMs.reduce((a, b) => (a.wpm < b.wpm ? a : b), segmentWPMs[0]);

  if (fastestSeg && fastestSeg.wpm > 160) {
    insights.push({
      id: "pacing",
      icon: "pacing",
      title: "You're rushing through key sections",
      body: `Between ${fastestSeg.segment.start.toFixed(1)}s and ${fastestSeg.segment.end.toFixed(1)}s, you hit ~${fastestSeg.wpm} WPM. That's the segment: "${fastestSeg.segment.text.slice(0, 80)}…"`,
      fix: "Slow down during complex ideas. Pause after introducing a new concept to let it land.",
    });
  } else if (scores.pacing < 60 && slowestSeg && slowestSeg.wpm < 80) {
    insights.push({
      id: "pacing",
      icon: "pacing",
      title: "Your pacing is too slow in places",
      body: `Around ${slowestSeg.segment.start.toFixed(1)}s–${slowestSeg.segment.end.toFixed(1)}s, you dropped to ~${slowestSeg.wpm} WPM. This can signal hesitation.`,
      fix: "Practice the segment until you can deliver it at 120+ WPM without rushing.",
    });
  }

  if (scores.expressiveness < 50) {
    const avgVar = segments.reduce((a, s) => a + s.acoustic_summary.pitch_variance, 0) / segments.length;
    insights.push({
      id: "monotone",
      icon: "monotone",
      title: "Your delivery sounds monotone",
      body: `Your average pitch variance is ${avgVar.toFixed(0)} Hz². Expressive speakers typically range 500–1500 Hz². A flat voice makes it hard for listeners to identify what's important.`,
      fix: "Pick 3 key words per sentence and consciously raise your pitch on them. Record yourself reading a children's story — that forces exaggeration.",
    });
  }

  const segmentEnergies = segments.map((s) => ({
    segment: s,
    energy: s.acoustic_summary.rms_energy,
  }));
  const lowestEnergySeg = segmentEnergies.reduce(
    (a, b) => (a.energy < b.energy ? a : b),
    segmentEnergies[0]
  );
  if (lowestEnergySeg && lowestEnergySeg.energy < avgEnergy * 0.5) {
    insights.push({
      id: "energy",
      icon: "energy",
      title: "You trail off at certain points",
      body: `Your energy dropped significantly around ${lowestEnergySeg.segment.start.toFixed(0)}–${lowestEnergySeg.segment.end.toFixed(0)}s. "${lowestEnergySeg.segment.text.slice(0, 60)}…" — this is where audiences check their phones.`,
      fix: "Consciously maintain breath support through the last word of each sentence. Record just the last 5 words of 3 sentences and compare.",
    });
  }

  const pauses: number[] = [];
  for (let i = 1; i < allWords.length; i++) {
    const gap = allWords[i].start - allWords[i - 1].end;
    if (gap > 0.1) pauses.push(gap);
  }
  const allShort = pauses.every((p) => p < 0.5);
  const freezes = pauses.filter((p) => p > 3.0);
  if (allShort && pauses.length > 2) {
    insights.push({
      id: "pause",
      icon: "pause",
      title: "You never pause for your audience",
      body: "All your pauses are under 0.5s. You're not giving your audience any time to absorb what you've said. Silence is a tool, not a weakness.",
      fix: "After every major point, deliberately pause for 1–2 seconds. Count 'one-Mississippi' in your head.",
    });
  } else if (freezes.length > 0) {
    insights.push({
      id: "pause",
      icon: "pause",
      title: `${freezes.length} freeze moment${freezes.length > 1 ? "s" : ""} detected`,
      body: `You had ${freezes.length} pause${freezes.length > 1 ? "s" : ""} longer than 3 seconds. These feel like you lost your place rather than strategic silence.`,
      fix: "If you freeze, don't restart from the top. Take a breath, summarize what you just said, and keep going.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "positive",
      icon: "positive",
      title: "Solid delivery overall",
      body: "Your energy, pacing, and expressiveness are all in a good range. Keep practicing to refine your style.",
      fix: "Record yourself regularly and compare sessions. Consistency is the goal.",
    });
  }

  return insights;
}

export function getEnergyColor(energy: number, avgEnergy: number): string {
  const ratio = avgEnergy > 0 ? energy / avgEnergy : 0.5;
  if (ratio < 0.4) return "#3b82f6";
  if (ratio < 0.7) return "#60a5fa";
  if (ratio < 1.0) return "#f59e0b";
  if (ratio < 1.5) return "#f97316";
  return "#ef4444";
}

export function getPitchColor(pitch: number, avgPitch: number): string {
  if (pitch <= 0) return "#6b7280";
  const ratio = avgPitch > 0 ? pitch / avgPitch : 1;
  if (ratio < 0.7) return "#7c3aed";
  if (ratio < 0.9) return "#a78bfa";
  if (ratio < 1.1) return "#c4b5fd";
  if (ratio < 1.3) return "#fbbf24";
  return "#facc15";
}

export function getEnergyLabel(energy: number, avgEnergy: number): string {
  if (avgEnergy <= 0) return "N/A";
  const ratio = energy / avgEnergy;
  if (ratio < 0.5) return "Low";
  if (ratio < 1.2) return "Medium";
  return "High";
}

export function getPitchLabel(pitch: number, avgPitch: number): string {
  if (pitch <= 0) return "Silent";
  if (avgPitch <= 0) return "N/A";
  const ratio = pitch / avgPitch;
  if (ratio < 0.85) return "Lower";
  if (ratio < 1.15) return "Average";
  return "Higher";
}
