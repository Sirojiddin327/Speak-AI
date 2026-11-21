import { useMemo, useState } from 'react';
import { GraduationCap, CheckCircle2, XCircle, RotateCcw, ArrowRight, Info } from 'lucide-react';
import { PageHeader, Card, Button, Badge, ProgressBar } from '@/components/ui';
import { CEFR_QUESTIONS, calculateCefrResult } from '@/services/demoData';
import type { CefrLevel, CefrResult } from '@/types';

const LEVEL_ORDER: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function CefrPage() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => CEFR_QUESTIONS.map(() => null));
  const [submitted, setSubmitted] = useState(false);
  const [current, setCurrent] = useState(0);

  const result: CefrResult = useMemo(() => calculateCefrResult(answers), [answers]);

  const allAnswered = answers.every((a) => a !== null);

  const select = (qi: number, oi: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setSubmitted(true);
  };

  const reset = () => {
    setAnswers(CEFR_QUESTIONS.map(() => null));
    setSubmitted(false);
    setCurrent(0);
  };

  const answeredCount = answers.filter((a) => a !== null).length;

  return (
    <div>
      <PageHeader title="CEFR Practice" subtitle="A short placement test to estimate your CEFR level." icon={GraduationCap} />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3 text-sm text-brand-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This is an <span className="font-semibold">indicative practice estimate</span>, not an official CEFR certification. It helps you see where you might place on the A1–C2 scale.</p>
      </div>

      {!submitted ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-navy-700">Question {current + 1} of {CEFR_QUESTIONS.length}</span>
                <Badge tone="brand">{CEFR_QUESTIONS[current].level}</Badge>
              </div>
              <p className="mt-4 text-base font-medium text-navy-800">{CEFR_QUESTIONS[current].prompt}</p>
              <div className="mt-4 space-y-2">
                {CEFR_QUESTIONS[current].options.map((opt, oi) => {
                  const selected = answers[current] === oi;
                  return (
                    <button
                      key={oi}
                      onClick={() => select(current, oi)}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-navy-100 hover:bg-navy-50 text-navy-700'
                      }`}
                    >
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold ${selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-navy-200 text-navy-400'}`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>Previous</Button>
                {current < CEFR_QUESTIONS.length - 1 ? (
                  <Button onClick={() => setCurrent((c) => c + 1)} disabled={answers[current] === null}>Next <ArrowRight className="h-4 w-4" /></Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={!allAnswered}><CheckCircle2 className="h-4 w-4" /> Submit test</Button>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card>
              <h2 className="section-title">Progress</h2>
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-navy-500"><span>{answeredCount}/{CEFR_QUESTIONS.length} answered</span></div>
                <ProgressBar value={(answeredCount / CEFR_QUESTIONS.length) * 100} />
              </div>
              <div className="mt-4 grid grid-cols-5 gap-1">
                {CEFR_QUESTIONS.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrent(i)}
                    className={`flex h-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                      i === current ? 'bg-brand-600 text-white' : answers[i] !== null ? 'bg-brand-50 text-brand-700' : 'bg-navy-50 text-navy-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </Card>
            <Card>
              <h2 className="section-title">About CEFR</h2>
              <p className="mt-2 text-sm text-navy-600">The Common European Framework of Reference (CEFR) describes language ability on six levels: A1, A2, B1, B2, C1, C2.</p>
              <ul className="mt-3 space-y-1 text-xs text-navy-500">
                {LEVEL_ORDER.map((l) => <li key={l} className="flex gap-2"><span className="font-semibold text-navy-700">{l}</span> — {levelDesc(l)}</li>)}
              </ul>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 animate-slide-up">
          <Card className="lg:col-span-1">
            <h2 className="section-title">Your result</h2>
            <div className="mt-4 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-600 text-white">
                <span className="text-3xl font-bold">{result.estimatedLevel}</span>
              </div>
              <p className="mt-3 text-sm text-navy-600">Estimated CEFR level</p>
              <p className="mt-1 text-2xl font-bold text-navy-800">{result.score}/{result.total} correct</p>
              <Button onClick={reset} variant="ghost" className="mt-4"><RotateCcw className="h-4 w-4" /> Retake test</Button>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="section-title">Breakdown by level</h2>
            <div className="mt-4 space-y-3">
              {LEVEL_ORDER.filter((l) => result.perLevel[l].total > 0).map((l) => {
                const stat = result.perLevel[l];
                const pct = (stat.correct / stat.total) * 100;
                return (
                  <div key={l}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold text-navy-700">{l}</span>
                      <span className="text-navy-500">{stat.correct}/{stat.total}</span>
                    </div>
                    <ProgressBar value={pct} tone={pct >= 50 ? 'success' : 'warning'} />
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-navy-500">
              Your estimated level is the highest level where you answered at least half of the questions correctly. This is an indicative practice estimate, not an official certification.
            </p>
          </Card>

          <Card className="lg:col-span-3">
            <h2 className="section-title">Review answers</h2>
            <div className="mt-4 space-y-3">
              {CEFR_QUESTIONS.map((q, i) => {
                const userAns = answers[i];
                const correct = userAns === q.correctIndex;
                return (
                  <div key={q.id} className={`rounded-xl border p-4 ${correct ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'}`}>
                    <div className="flex items-start gap-2">
                      {correct ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 text-rose-600 shrink-0" />}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-navy-800"><Badge tone="neutral">{q.level}</Badge> {q.prompt}</p>
                        <p className="mt-1 text-sm text-navy-600">Your answer: <span className={correct ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>{userAns !== null ? q.options[userAns] : '—'}</span></p>
                        {!correct && <p className="text-sm text-emerald-700">Correct: {q.options[q.correctIndex]}</p>}
                        <p className="mt-1 text-xs text-navy-500">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function levelDesc(l: CefrLevel): string {
  return { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper intermediate', C1: 'Advanced', C2: 'Proficient' }[l];
}
