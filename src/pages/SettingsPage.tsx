import { Settings as SettingsIcon, User, Target, GraduationCap, Info, LogOut, KeyRound, Mic } from 'lucide-react';
import { PageHeader, Card, Button, Badge } from '@/components/ui';
import { useDemo } from '@/context/DemoContext';
import { getAIStatus } from '@/services/aiService';
import type { CefrLevel } from '@/types';

const LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function SettingsPage() {
  const { user, setDailyGoal, setCefrLevel, exitDemo } = useDemo();
  const status = getAIStatus();
  if (!user) return null;

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your demo profile and preferences." icon={SettingsIcon} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-brand-600" />
            <h2 className="section-title">Profile</h2>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Account type" value={<Badge tone="warning">Demo account</Badge>} />
            <Row label="Joined" value={user.joinedAt} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-brand-600" />
            <h2 className="section-title">CEFR level</h2>
          </div>
          <p className="mt-2 text-sm text-navy-500">Set the level used to tailor AI conversations and feedback.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setCefrLevel(l)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                  user.cefrLevel === l ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-navy-100 text-navy-600 hover:bg-navy-50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-600" />
            <h2 className="section-title">Daily learning goal</h2>
          </div>
          <p className="mt-2 text-sm text-navy-500">Target minutes of practice per day.</p>
          <div className="mt-4 flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={user.dailyGoalMinutes}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              className="flex-1 accent-brand-600"
            />
            <span className="w-20 text-right text-lg font-bold text-navy-800">{user.dailyGoalMinutes}m</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-brand-600" />
            <h2 className="section-title">AI service status</h2>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Live AI configured" value={status.configured ? <Badge tone="success">Yes</Badge> : <Badge tone="warning">No — demo fallback</Badge>} />
            <Row label="Provider" value={status.provider ?? '—'} />
          </div>
          <div className="mt-4 rounded-xl bg-navy-50/60 p-3 text-xs text-navy-500">
            <Info className="mr-1 inline h-3.5 w-3.5" />
            To enable live AI, add <code className="rounded bg-white px-1">VITE_AI_API_URL</code> and <code className="rounded bg-white px-1">VITE_AI_API_KEY</code> to the environment. API keys are never exposed in the interface.
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-brand-600" />
            <h2 className="section-title">Microphone & browser notes</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-navy-600">
            <li>Speech recognition uses your browser's built-in API (best in Chrome over HTTPS).</li>
            <li>Allow microphone access when prompted. No audio is stored.</li>
            <li>If your browser doesn't support speech recognition, you can still type in the speaking tutor.</li>
          </ul>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="section-title">End demo session</h2>
              <p className="mt-1 text-sm text-navy-500">Exit the demo and return to the landing page.</p>
            </div>
            <Button onClick={exitDemo} variant="ghost"><LogOut className="h-4 w-4" /> Exit demo</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-navy-100 pb-2 last:border-0">
      <span className="text-navy-500">{label}</span>
      <span className="font-medium text-navy-800">{value}</span>
    </div>
  );
}
