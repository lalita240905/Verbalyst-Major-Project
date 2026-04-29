import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceScope — Speech Analysis",
  description: "AI-powered speech acoustic analysis. Understand energy, pitch, and delivery at the word level.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="noise-bg min-h-screen">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,15,0.8)", backdropFilter: "blur(20px)" }}>
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--volt)" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8 Q4 3 8 8 Q12 13 14 8" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <span className="font-display font-700 text-lg tracking-tight text-cream">
              Voice<span style={{ color: "var(--volt)" }}>Scope</span>
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="/" className="text-sm text-cream-dim hover:text-cream transition-colors font-body">
              Analyse
            </a>
            <a href="/sessions" className="text-sm text-cream-dim hover:text-cream transition-colors font-body">
              Sessions
            </a>
          </div>
        </nav>
        <div className="pt-20 relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
