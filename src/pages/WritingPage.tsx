import { useState } from 'react';
import { PenLine, CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react';
import { PageHeader, Card, DemoBanner, Button, Spinner, Badge, ProgressBar, EmptyState } from '@/components/ui';
import { getWritingFeedback, isDemoMode } from '@/services/aiService';
import type { WritingFeedback } from '@/types';

const PROMPTS = [
  'Write a short paragraph (80+ words) about your hometown.',
  'Describe your favorite hobby and why you enjoy it.',
  'Why are you learning English? Explain your goals.',
];

export function WritingPage() {
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoResult, setIsDemoResult] = useState(false);

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  const analyze = async () => {
    setError(null);
    if (words < 20) {
      setError('Please write at least 20 words so the analysis is meaningful.');
      return;
    }
    setLoading(true);
    setFeedback(null);
    try {
      const res = await getWritingFeedback(text);
      setFeedback(res.feedback);
      setIsDemoResult(res.isDemo);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setText('');
    setFeedback(null);
    setError(null);
    setIsDemoResult(false);
  };

  return (
    <div>
      <PageHeader title="Writing Checker" subtitle="Submit your writing for grammar, vocabulary, and coherence feedback." icon={PenLine} />
      {isDemoMode && <DemoBanner />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-5">
          <Card>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-title">Your essay</h2>
              <span className="text-xs text-navy-500">{words} words</span>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {PROMPTS.map((p) => (
                <button key={p} onClick={() => setText(`${p}\n\n`)} className="rounded-lg border border-navy-100 px-2.5 py-1 text-xs text-navy-500 hover:bg-navy-50" title={p}>
                  {p.split('(')[0].trim()}
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your essay here in English… (at least 20 words)"
              rows={14}
              className="input resize-none leading-relaxed"
            />
            {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
            <div className="mt-4 flex gap-3">
              <Button onClick={() => void analyze()} disabled={loading || words < 20}>
                {loading ? <Spinner /> : <CheckCircle2 className="h-4 w-4" />} Analyze writing
              </Button>
              <Button onClick={reset} variant="ghost" disabled={loading}><RotateCcw className="h-4 w-4" /> Clear</Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-5">
          {loading && (
            <Card>
              <div className="flex items-center gap-2 text-sm text-navy-600"><Spinner /> Analyzing your writing…</div>
            </Card>
          )}

          {!feedback && !loading && (
            <EmptyState title="No feedback yet" hint="Write at least 20 words and click Analyze." />
          )}

          {feedback && (
            <div className="space-y-5 animate-slide-up">
              <Card>
                <div className="flex items-center justify-between">
                  <h2 className="section-title">Overall result</h2>
                  {isDemoResult && <Badge tone="warning">Demo fallback</Badge>}
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-3xl font-bold text-navy-800">{feedback.overallScore}<span className="text-base text-navy-400">/100</span></p>
                  <Badge tone="brand">Est. CEFR {feedback.cefrLevel}</Badge>
                </div>
                <div className="mt-4 space-y-3">
                  <ScoreBar label="Grammar" score={feedback.grammar.score} />
                  <ScoreBar label="Vocabulary" score={feedback.vocabulary.score} />
                  <ScoreBar label="Coherence" score={feedback.coherence.score} />
                </div>
              </Card>

              <Card>
                <h2 className="section-title">Grammar</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
                  {feedback.grammar.notes.map((n, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" /> {n}</li>)}
                </ul>
              </Card>

              <Card>
                <h2 className="section-title">Vocabulary</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
                  {feedback.vocabulary.notes.map((n, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" /> {n}</li>)}
                </ul>
              </Card>

              <Card>
                <h2 className="section-title">Coherence</h2>
                <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
                  {feedback.coherence.notes.map((n, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" /> {n}</li>)}
                </ul>
              </Card>

              <Card>
                <p className="flex items-center gap-2 text-sm font-semibold text-navy-800"><Lightbulb className="h-4 w-4 text-amber-500" /> Suggestions to improve</p>
                <ul className="mt-2 space-y-1.5 text-sm text-navy-600">
                  {feedback.suggestions.map((s, i) => <li key={i} className="flex gap-2"><span className="text-brand-500">•</span> {s}</li>)}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const tone = score >= 80 ? 'success' : score >= 60 ? 'brand' : 'warning';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="font-medium text-navy-600">{label}</span>
        <span className="font-semibold text-navy-700">{score}/100</span>
      </div>
      <ProgressBar value={score} tone={tone} />
    </div>
  );
}
