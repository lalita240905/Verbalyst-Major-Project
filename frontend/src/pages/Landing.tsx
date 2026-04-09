import { Link } from "react-router-dom";
import { Mic, BarChart3, MessageSquare, Zap, Target, TrendingUp, Star, Circle } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b-[3px] border-foreground">
        <h1 className="font-display text-2xl font-black tracking-tight">Verbalyst</h1>
        <div className="hidden md:flex items-center gap-8">
          <a href="#about" className="font-semibold hover:text-primary transition-colors">About</a>
          <a href="#features" className="font-semibold hover:text-primary transition-colors">Features</a>
          <Link to="/dashboard" className="brutal-btn bg-secondary text-secondary-foreground text-sm rounded-lg">
            Start Speaking
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 py-20 md:py-32 overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-16 right-16 w-20 h-20 bg-secondary brutal-border rounded-full hidden md:block" />
        <div className="absolute top-40 right-48 w-12 h-12 bg-coral brutal-border rotate-12 hidden md:block" />
        <div className="absolute bottom-20 right-32 w-16 h-16 bg-mint brutal-border rounded-full hidden md:block" />
        <div className="absolute top-32 left-[60%] w-8 h-8 bg-primary brutal-border rotate-45 hidden md:block" />
        <Star className="absolute top-24 right-[30%] w-10 h-10 text-secondary hidden md:block" strokeWidth={3} />
        <Circle className="absolute bottom-32 left-20 w-14 h-14 text-coral hidden md:block" strokeWidth={3} />

        <div className="max-w-4xl">
          <p className="font-display text-lg font-semibold text-muted-foreground mb-4">AI-Powered Speech Coach</p>
          <h2 className="font-display text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-8">
            YOUR VOICE<br />HAS DATA.<br />
            <span className="text-primary">WE DECODE IT.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10">
            Record. Analyze. Improve. Verbalyst uses AI to break down your speech patterns and make you a confident communicator.
          </p>
          <Link to="/record" className="brutal-btn bg-secondary text-secondary-foreground text-lg rounded-lg inline-flex items-center gap-2">
            <Mic className="w-5 h-5" /> Start Speaking
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section id="about" className="px-8 py-20 border-t-[3px] border-foreground">
        <h3 className="font-display text-3xl md:text-4xl font-black mb-12 text-center">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Mic, title: "1. Record", desc: "Hit record and speak naturally. Talk about anything — a pitch, a story, or practice material.", color: "bg-secondary" },
            { icon: BarChart3, title: "2. AI Analyzes", desc: "Our AI breaks down your clarity, pace, filler words, pitch variation, and script coherence.", color: "bg-primary text-primary-foreground" },
            { icon: MessageSquare, title: "3. Get Feedback", desc: "Receive direct, actionable insights. No fluff — just what you need to improve right now.", color: "bg-mint" },
          ].map((step) => (
            <div key={step.title} className={`brutal-card p-8 ${step.color} rounded-lg`}>
              <step.icon className="w-10 h-10 mb-4" strokeWidth={2.5} />
              <h4 className="font-display text-2xl font-bold mb-3">{step.title}</h4>
              <p className="text-base leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 border-t-[3px] border-foreground">
        <h3 className="font-display text-3xl md:text-4xl font-black mb-12 text-center">Features</h3>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Zap, title: "Articulation Analysis", desc: "Speech rate, pauses, filler words, and pitch variation scored in real time.", color: "bg-coral" },
            { icon: Target, title: "Script Intelligence", desc: "Structure, coherence, and engagement of your content evaluated by AI.", color: "bg-secondary" },
            { icon: TrendingUp, title: "Progress Tracking", desc: "See your improvement over time with detailed session history and trend graphs.", color: "bg-primary text-primary-foreground" },
          ].map((feat) => (
            <div key={feat.title} className={`brutal-card p-8 ${feat.color} rounded-lg md:even:-translate-y-4`}>
              <feat.icon className="w-10 h-10 mb-4" strokeWidth={2.5} />
              <h4 className="font-display text-xl font-bold mb-2">{feat.title}</h4>
              <p className="text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-20 border-t-[3px] border-foreground">
        <div className="brutal-card bg-primary text-primary-foreground p-12 md:p-16 rounded-xl max-w-4xl mx-auto text-center">
          <h3 className="font-display text-3xl md:text-5xl font-black mb-6">Ready to Sound Better?</h3>
          <p className="text-lg mb-8 opacity-90">Your next presentation, interview, or pitch deserves data-backed preparation.</p>
          <Link to="/record" className="brutal-btn bg-secondary text-secondary-foreground text-lg rounded-lg inline-flex items-center gap-2 border-primary-foreground">
            <Mic className="w-5 h-5" /> Try Verbalyst Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-8 border-t-[3px] border-foreground text-center">
        <p className="font-display font-bold text-sm text-muted-foreground">© 2026 Verbalyst. Speak with confidence.</p>
      </footer>
    </div>
  );
};

export default Landing;
