import { useState } from 'react';
import { Mic, MicOff, CheckCircle2, AlertCircle, XCircle, RefreshCw, Lightbulb } from 'lucide-react';
import { PageHeader, Card, DemoBanner, Button, Spinner, Badge, EmptyState } from '@/components/ui';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getPronunciationAnalysis, isDemoMode } from '@/services/aiService';
import type { PronunciationResult } from '@/types';

const PHRASES = [
  'I would like to order a coffee please',
  'The weather is beautiful today',
  'My favorite subject is mathematics',
  'Can you help me with my homework',
  'I am learning English to study abroad',
];

export function PronunciationPage() {
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sr = useSpeechRecognition('en-US');

  const analyze = async () => {
    setError(null);
    if (!sr.transcript.trim()) {
      setError('No speech captured. Press the microphone and read the phrase aloud.');
      return;
    }
    setLoading(true);
    try {
      const res = await getPronunciationAnalysis(sr.transcript, phrase);
      setResult(res.result);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    sr.reset();
    setResult(null);
    setError(null);
  };

  const statusStyles = {
    good: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    review: { icon: AlertCircle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    difficult: { icon: XCircle, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  return (
    <div>
      <PageHeader title="Pronunciation Lab" subtitle="Read a phrase aloud and get word-level feedback." icon={Mic} />
      {isDemoMode && <DemoBanner />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <label className="text-sm font-semibold text-navy-700">Choose a phrase to practice</label>
            <select
              value={phrase}
              onChange={(e) => { setPhrase(e.target.value); reset(); }}
              className="input mt-2"
            >
              {PHRASES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <div className="mt-4 rounded-xl bg-brand-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Read this aloud</p>
              <p className="mt-1 text-lg font-semibold text-navy-800">{phrase}</p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => (sr.listening ? sr.stop() : sr.start())}
                disabled={!sr.supported || loading}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  sr.listening ? 'bg-rose-500 text-white animate-pulse-soft' : 'btn-primary'
                } disabled:opacity-50`}
              >
                {sr.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {sr.listening ? 'Stop recording' : 'Start recording'}
              </button>
              <Button onClick={() => void analyze()} variant="soft" disabled={loading || !sr.transcript.trim()}>
                {loading ? <Spinner /> : <RefreshCw className="h-4 w-4" />} Analyze pronunciation
              </Button>
              <Button onClick={reset} variant="ghost">Reset</Button>
            </div>

            {!sr.supported && (
              <p className="mt-3 text-xs text-navy-400">Speech recognition isn't supported in this browser. Use Chrome over HTTPS for microphone input.</p>
            )}
            {sr.error && <p className="mt-3 text-xs text-rose-500">{sr.error}</p>}
            {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
          </Card>

          <Card>
            <h2 className="section-title">Recognized speech</h2>
            <div className="mt-3 min-h-[60px] rounded-xl border border-navy-100 bg-navy-50/40 p-4 text-sm text-navy-700">
              {sr.transcript || <span className="text-navy-400">Your spoken words will appear here…</span>}
            </div>
          </Card>

          {result && (
            <Card className="animate-slide-up">
              <div className="flex items-center justify-between">
                <h2 className="section-title">Word-level feedback</h2>
                <Badge tone={result.overallScore >= 70 ? 'success' : 'warning'}>Score {result.overallScore}/100</Badge>
              </div>
              <p className="mt-2 text-xs text-navy-500">
                This is a transcript-level estimate based on recognized words, not phoneme-level pronunciation scoring. A dedicated pronunciation API is required for precise phonetic analysis.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.words.map((w, i) => {
                  const s = statusStyles[w.status];
                  const Icon = s.icon;
                  return (
                    <span key={i} title={w.note} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium ${s.cls}`}>
                      <Icon className="h-3.5 w-3.5" /> {w.word}
                    </span>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Lightbulb className="h-4 w-4" /> Recommendations</p>
                <ul className="mt-2 space-y-1.5 text-sm text-amber-800/90">
                  {result.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> {r}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}

          {!result && !sr.transcript && (
            <EmptyState title="No analysis yet" hint="Record yourself reading the phrase, then analyze." />
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="section-title">Legend</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-navy-700"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Good — word recognized clearly</li>
              <li className="flex items-center gap-2 text-navy-700"><AlertCircle className="h-4 w-4 text-amber-500" /> Review — possibly mispronounced</li>
              <li className="flex items-center gap-2 text-navy-700"><XCircle className="h-4 w-4 text-rose-500" /> Difficult — missing or unclear</li>
            </ul>
          </Card>
          <Card>
            <h2 className="section-title">Tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-navy-600">
              <li>Speak in a quiet room.</li>
              <li>Read slowly and clearly.</li>
              <li>Allow microphone access when prompted.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
