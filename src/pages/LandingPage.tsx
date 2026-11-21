import { ArrowRight, BookOpen, Mic, PenLine, GraduationCap, BarChart3, Sparkles, Globe2, ShieldCheck, Zap } from 'lucide-react';
import { getAIStatus } from '@/services/aiService';

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  const status = getAIStatus();

  const features = [
    { icon: Sparkles, title: 'AI Speaking Tutor', desc: 'Practice real conversations with instant feedback on grammar, vocabulary, and fluency.' },
    { icon: Mic, title: 'Pronunciation Lab', desc: 'Speak into your microphone and get word-level pronunciation feedback.' },
    { icon: PenLine, title: 'Writing Checker', desc: 'Submit essays and receive structured feedback aligned to CEFR levels.' },
    { icon: GraduationCap, title: 'CEFR Practice', desc: 'Take a short placement test and get an indicative CEFR level estimate.' },
    { icon: BarChart3, title: 'Learning Progress', desc: 'Track weekly activity, speaking sessions, and writing submissions.' },
    { icon: Globe2, title: 'Built for Uzbekistan', desc: 'Designed for Uzbek students working toward international English proficiency.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-navy-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-800">SpeakUz AI</p>
              <p className="text-[11px] text-navy-500">English for Uzbekistan</p>
            </div>
          </div>
          <button onClick={onEnter} className="btn-primary">
            Try Demo <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand-50/60 via-white to-white" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 lg:px-10 lg:pt-28">
          <div className="max-w-3xl animate-slide-up">
            <span className="badge bg-brand-50 text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered English learning
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-navy-800 sm:text-5xl lg:text-6xl">
              Speak English with <span className="text-brand-600">confidence</span>, one conversation at a time.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-navy-500">
              SpeakUz AI helps students in Uzbekistan improve speaking, pronunciation, writing, and CEFR skills through personalized AI assistance — built for the classroom and beyond.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button onClick={onEnter} className="btn-primary px-6 py-3 text-base">
                Try Demo — no signup needed <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#features" className="btn-ghost px-6 py-3 text-base">Explore features</a>
            </div>
            <p className="mt-4 text-xs text-navy-500">
              {status.configured ? (
                <>Live AI is configured ({status.provider}).</>
              ) : (
                <>Demo mode: transparent rule-based fallbacks will be shown until a live AI key is added.</>
              )}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <ShieldCheck className="h-6 w-6 text-brand-600" />
              <p className="mt-3 text-sm font-semibold text-navy-800">No signup required</p>
              <p className="mt-1 text-xs text-navy-500">Judges and students can enter the demo instantly.</p>
            </div>
            <div className="card p-5">
              <Zap className="h-6 w-6 text-brand-600" />
              <p className="mt-3 text-sm font-semibold text-navy-800">Real microphone input</p>
              <p className="mt-1 text-xs text-navy-500">Browser speech recognition where supported.</p>
            </div>
            <div className="card p-5">
              <GraduationCap className="h-6 w-6 text-brand-600" />
              <p className="mt-3 text-sm font-semibold text-navy-800">CEFR-aligned feedback</p>
              <p className="mt-1 text-xs text-navy-500">Practice and progress mapped to A1–C2 levels.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold text-navy-800">Everything you need to practice English</h2>
          <p className="mt-3 text-navy-500">A focused toolkit covering the four core skills, with progress tracking to keep students motivated.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card p-6 transition hover:shadow-card animate-fade-in">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-navy-800">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-navy-100 bg-navy-50/40">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
          <div className="card flex flex-col items-center justify-between gap-5 p-8 text-center sm:flex-row sm:text-left">
            <div>
              <h3 className="text-xl font-bold text-navy-800">Ready to explore SpeakUz AI?</h3>
              <p className="mt-1 text-sm text-navy-500">Enter the demo and try every feature in under two minutes.</p>
            </div>
            <button onClick={onEnter} className="btn-primary px-6 py-3 text-base whitespace-nowrap">
              Open the demo <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-100">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-xs text-navy-500 lg:px-10">
          SpeakUz AI — Educational MVP demo. Sample data is for demonstration only and is not real AI analysis.
        </div>
      </footer>
    </div>
  );
}
