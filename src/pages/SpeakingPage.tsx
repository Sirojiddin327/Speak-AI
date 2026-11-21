import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';
import type { ChatMessage, ConversationContext, CefrLevel } from '@/types';
import { PageHeader, Card, DemoBanner, Button, Spinner, Badge } from '@/components/ui';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getSpeakingResponse, isDemoMode } from '@/services/aiService';
import { useDemo } from '@/context/DemoContext';

const TOPICS = [
  { id: 'daily', label: 'Daily routine' },
  { id: 'travel', label: 'Travel' },
  { id: 'school', label: 'School & studies' },
  { id: 'food', label: 'Food & cooking' },
  { id: 'hobbies', label: 'Hobbies' },
];

const GREETING: ChatMessage = {
  id: 'greet',
  role: 'assistant',
  content: "Hi! I'm your AI speaking tutor. Pick a topic and tell me a little about it — for example, 'I wake up at 7 every morning.' Ready when you are!",
  createdAt: Date.now(),
};

export function SpeakingPage() {
  const { user } = useDemo();
  const [topic, setTopic] = useState(TOPICS[0].label);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sr = useSpeechRecognition('en-US');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setError(null);

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed, createdAt: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    const context: ConversationContext = {
      topic,
      level: (user?.cefrLevel ?? 'B1') as CefrLevel,
    };
    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const res = await getSpeakingResponse(trimmed, context, history);
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        feedback: res.feedback,
        createdAt: Date.now(),
        isDemo: res.isDemo,
      };
      setMessages((m) => [...m, aiMsg]);
    } catch {
      setError('Something went wrong reaching the tutor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  const handleMicToggle = () => {
    if (!sr.supported) return;
    if (sr.listening) {
      sr.stop();
      if (sr.transcript) setInput(sr.transcript);
    } else {
      sr.start();
    }
  };

  useEffect(() => {
    if (!sr.listening && sr.transcript) {
      setInput((prev) => (prev ? prev : sr.transcript));
    }
  }, [sr.listening, sr.transcript]);

  return (
    <div>
      <PageHeader title="AI Speaking Tutor" subtitle="Practice English conversation with instant feedback." icon={Sparkles} />
      {isDemoMode && <DemoBanner />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="flex h-[600px] flex-col p-0">
            <div className="flex items-center justify-between border-b border-navy-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy-800">Topic:</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="rounded-lg border border-navy-100 bg-white px-2.5 py-1.5 text-sm text-navy-700 focus:border-brand-500 focus:outline-none"
                >
                  {TOPICS.map((t) => (
                    <option key={t.id} value={t.label}>{t.label}</option>
                  ))}
                </select>
              </div>
              <Badge tone="brand"><Sparkles className="h-3 w-3" /> {user?.cefrLevel}</Badge>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-navy-500">
                  <Spinner /> Tutor is thinking…
                </div>
              )}
            </div>

            {error && <p className="px-4 pb-2 text-xs text-rose-600">{error}</p>}

            <form onSubmit={handleSubmit} className="border-t border-navy-100 p-3">
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleMicToggle}
                  disabled={!sr.supported}
                  title={sr.supported ? 'Speak' : 'Speech recognition not supported in this browser'}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
                    sr.listening ? 'bg-rose-500 text-white animate-pulse-soft' : sr.supported ? 'bg-brand-50 text-brand-600 hover:bg-brand-100' : 'bg-navy-50 text-navy-300'
                  }`}
                >
                  {sr.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  placeholder={sr.listening ? 'Listening… speak now' : 'Type your message, or use the microphone'}
                  rows={1}
                  className="input max-h-32 resize-none py-2.5"
                />
                <Button type="submit" disabled={!input.trim() || loading} className="h-11 px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!sr.supported && (
                <p className="mt-2 text-[11px] text-navy-400">
                  Microphone speech recognition isn't available in this browser. You can still type to chat. (Best in Chrome over HTTPS.)
                </p>
              )}
              {sr.error && <p className="mt-2 text-[11px] text-rose-500">{sr.error}</p>}
            </form>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h2 className="section-title">How it works</h2>
            <ol className="mt-3 space-y-2 text-sm text-navy-600">
              <li>1. Choose a topic and your CEFR level is applied.</li>
              <li>2. Type or speak your answer (mic in supported browsers).</li>
              <li>3. The tutor replies and gives feedback on your last message.</li>
            </ol>
          </Card>
          <Card>
            <h2 className="section-title">Conversation tips</h2>
            <ul className="mt-3 space-y-2 text-sm text-navy-600">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Use full sentences.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Try linking words: and, but, because.</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Ask the tutor questions too.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser ? 'bg-brand-600 text-white' : 'bg-navy-50 text-navy-800'
          }`}
        >
          {message.content}
        </div>
        {message.feedback && (
          <div className="mt-2 rounded-xl border border-navy-100 bg-white p-3 text-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-navy-700">Feedback on your message</span>
              {message.isDemo && <Badge tone="warning">Demo fallback</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <FeedbackStat label="Score" value={`${message.feedback.scoreOutOf100}`} />
              <FeedbackStat label="Grammar" value={shortNote(message.feedback.grammar)} title={message.feedback.grammar} />
              <FeedbackStat label="Vocabulary" value={shortNote(message.feedback.vocabulary)} title={message.feedback.vocabulary} />
            </div>
            <p className="mt-2 text-navy-500"><Volume2 className="mr-1 inline h-3 w-3" />{message.feedback.fluency}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackStat({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div title={title} className="rounded-lg bg-navy-50 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wide text-navy-400">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-navy-700">{value}</p>
    </div>
  );
}

function shortNote(s: string): string {
  const t = s.split('.')[0];
  return t.length > 28 ? t.slice(0, 25) + '…' : t;
}
