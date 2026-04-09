import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, Pause, AlertTriangle, Smile, Lightbulb } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const trendData = [
  { session: "1", pace: 65, clarity: 58 },
  { session: "2", pace: 70, clarity: 62 },
  { session: "3", pace: 68, clarity: 70 },
  { session: "4", pace: 75, clarity: 72 },
  { session: "5", pace: 72, clarity: 78 },
  { session: "6", pace: 78, clarity: 80 },
];

const metrics = [
  { label: "Clarity", value: "82%", icon: TrendingUp, color: "bg-primary text-primary-foreground" },
  { label: "Pace", value: "145 wpm", icon: Pause, color: "bg-mint" },
  { label: "Filler Words", value: "4", icon: AlertTriangle, color: "bg-secondary" },
  { label: "Confidence", value: "76%", icon: Smile, color: "bg-coral" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="max-w-5xl">
        {/* Welcome Card */}
        <div className="brutal-card bg-coral p-8 md:p-10 rounded-xl mb-8">
          <p className="font-display text-sm font-semibold uppercase tracking-wider mb-2">Welcome Back</p>
          <h1 className="font-display text-4xl md:text-5xl font-black mb-2">You're Getting Better.</h1>
          <div className="flex items-end gap-4 mt-4">
            <span className="font-display text-7xl md:text-8xl font-black leading-none">78</span>
            <span className="font-display text-2xl font-bold text-foreground/60 mb-2">/100</span>
          </div>
          <p className="text-sm mt-2 text-foreground/70">Overall Speaking Score</p>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <div key={m.label} className={`brutal-card p-5 rounded-lg ${m.color}`}>
              <m.icon className="w-6 h-6 mb-3" strokeWidth={2.5} />
              <p className="text-sm font-semibold">{m.label}</p>
              <p className="font-display text-2xl font-black">{m.value}</p>
            </div>
          ))}
        </div>

        {/* AI Insight */}
        <div className="brutal-card bg-secondary p-6 rounded-lg mb-8 rotate-[-0.5deg] hover:rotate-0 transition-transform">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-6 h-6 mt-1 flex-shrink-0" strokeWidth={2.5} />
            <div>
              <h3 className="font-display text-lg font-bold mb-1">AI Insight</h3>
              <p className="text-sm leading-relaxed">
                You're speaking too fast in the first 30 seconds. Try adding a deliberate pause after your opening statement. 
                Your filler words decreased by 40% since last session — great progress!
              </p>
            </div>
          </div>
        </div>

        {/* Trend Graph */}
        <div className="brutal-card bg-card p-6 rounded-lg">
          <h3 className="font-display text-xl font-bold mb-6">Speech Trends</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="session" axisLine={{ strokeWidth: 2 }} tickLine={false} className="text-sm font-semibold" />
              <YAxis axisLine={{ strokeWidth: 2 }} tickLine={false} className="text-sm" />
              <Tooltip />
              <Line type="monotone" dataKey="pace" stroke="hsl(217, 91%, 60%)" strokeWidth={3} dot={{ r: 5, strokeWidth: 2 }} />
              <Line type="monotone" dataKey="clarity" stroke="hsl(160, 59%, 52%)" strokeWidth={3} dot={{ r: 5, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-6 mt-4 text-sm font-semibold">
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-primary rounded-full inline-block" /> Pace</span>
            <span className="flex items-center gap-2"><span className="w-3 h-3 bg-mint rounded-full inline-block" /> Clarity</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
