import DashboardLayout from "@/components/DashboardLayout";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, Award, Calendar } from "lucide-react";

const trendData = [
  { date: "Mar 1", score: 58 },
  { date: "Mar 8", score: 62 },
  { date: "Mar 15", score: 65 },
  { date: "Mar 22", score: 70 },
  { date: "Mar 29", score: 68 },
  { date: "Apr 5", score: 75 },
  { date: "Apr 7", score: 78 },
];

const improvements = [
  { label: "Clarity", change: "+12%", positive: true },
  { label: "Filler Words", change: "-40%", positive: true },
  { label: "Pace Control", change: "+8%", positive: true },
  { label: "Pitch Range", change: "+5%", positive: true },
];

const sessions = [
  { date: "Apr 7, 2026", score: 78, status: "Improving", color: "bg-mint" },
  { date: "Apr 5, 2026", score: 75, status: "Improving", color: "bg-mint" },
  { date: "Mar 29, 2026", score: 68, status: "Needs Work", color: "bg-coral" },
  { date: "Mar 22, 2026", score: 70, status: "Improving", color: "bg-mint" },
  { date: "Mar 15, 2026", score: 65, status: "Needs Work", color: "bg-coral" },
];

const badges = [
  { title: "Confident Speaker", color: "bg-primary text-primary-foreground" },
  { title: "Clear Communicator", color: "bg-mint" },
  { title: "Filler Slayer", color: "bg-secondary" },
  { title: "5 Sessions", color: "bg-coral" },
];

const Progress = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        <h1 className="font-display text-4xl font-black mb-8">Your Progress</h1>

        {/* Trend Graph */}
        <div className="brutal-card bg-card p-6 rounded-lg mb-8">
          <h2 className="font-display text-xl font-bold mb-6">Performance Over Time</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <XAxis dataKey="date" axisLine={{ strokeWidth: 2 }} tickLine={false} className="text-xs font-semibold" />
              <YAxis domain={[50, 100]} axisLine={{ strokeWidth: 2 }} tickLine={false} className="text-xs" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="hsl(217, 91%, 60%)" strokeWidth={3} dot={{ r: 5, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Improvement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {improvements.map((imp) => (
            <div key={imp.label} className="brutal-card bg-card p-5 rounded-lg">
              <TrendingUp className="w-5 h-5 mb-2 text-mint" strokeWidth={2.5} />
              <p className="text-sm font-semibold">{imp.label}</p>
              <p className="font-display text-2xl font-black text-mint">{imp.change}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <h2 className="font-display text-xl font-bold mb-4">Achievements</h2>
        <div className="flex flex-wrap gap-3 mb-10">
          {badges.map((badge) => (
            <span key={badge.title} className={`brutal-border brutal-shadow-sm px-4 py-2 rounded-full font-bold text-sm ${badge.color}`}>
              <Award className="w-4 h-4 inline mr-1 -mt-0.5" /> {badge.title}
            </span>
          ))}
        </div>

        {/* Session History */}
        <h2 className="font-display text-xl font-bold mb-4">Session History</h2>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="brutal-card bg-card p-5 rounded-lg flex items-center justify-between hover:translate-x-1 transition-transform cursor-pointer">
              <div className="flex items-center gap-4">
                <Calendar className="w-5 h-5 text-muted-foreground" strokeWidth={2.5} />
                <div>
                  <p className="font-semibold">{s.date}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full brutal-border ${s.color}`}>{s.status}</span>
                </div>
              </div>
              <p className="font-display text-2xl font-black">{s.score}<span className="text-sm text-muted-foreground">/100</span></p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;
