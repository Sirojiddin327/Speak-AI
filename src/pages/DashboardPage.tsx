import { Activity, BookOpen, Clock, Flame, GraduationCap, Mic, PenLine, Sparkles, ArrowRight, Target } from 'lucide-react';
import type { PageKey } from '@/types';
import { useDemo } from '@/context/DemoContext';
import { Card, DemoBanner, PageHeader, ProgressBar, StatCard, Badge } from '@/components/ui';
import { DEMO_ACTIVITIES, DEMO_PROGRESS, DEMO_WEEKLY_MINUTES, RECOMMENDED_EXERCISES } from '@/services/demoData';
import { isDemoMode } from '@/services/aiService';

const activityIcon = {
  speaking: Sparkles,
  writing: PenLine,
  pronunciation: Mic,
  cefr: GraduationCap,
};

export function DashboardPage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  const { user } = useDemo();
  if (!user) return null;

  const goalPct = Math.round((user.todayMinutes / user.dailyGoalMinutes) * 100);
  const maxWeekly = Math.max(...DEMO_WEEKLY_MINUTES.map((d) => d.minutes));

  const recommendedNav: Record<string, PageKey> = {
    speaking: 'speaking',
    writing: 'writing',
    pronunciation: 'pronunciation',
    cefr: 'cefr',
  };

  return (
    <div>
      <PageHeader title={`Welcome back, ${user.name.split(' ')[0]}`} subtitle="Here's your English learning overview for today." icon={BookOpen} />

      {isDemoMode && <DemoBanner />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current CEFR level" value={user.cefrLevel} icon={GraduationCap} />
        <StatCard label="Total practice" value={`${DEMO_PROGRESS.totalPracticeMinutes}m`} icon={Clock} accent="success" />
        <StatCard label="Speaking score" value={`${DEMO_PROGRESS.speakingTrend[DEMO_PROGRESS.speakingTrend.length - 1]}`} icon={Sparkles} accent="amber" />
        <StatCard label="Writing score" value={`${DEMO_PROGRESS.writingTrend[DEMO_PROGRESS.writingTrend.length - 1]}`} icon={PenLine} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent activities</h2>
            <Badge tone="neutral">Demo data</Badge>
          </div>
          <div className="mt-4 space-y-3">
            {DEMO_ACTIVITIES.slice(0, 5).map((a) => {
              const Icon = activityIcon[a.type];
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-3 transition hover:bg-navy-50/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-800">{a.title}</p>
                    <p className="truncate text-xs text-navy-500">{a.detail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-navy-700">{a.minutes}m</p>
                    <p className="text-[11px] text-navy-400">{a.date.slice(5)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="section-title">Daily goal</h2>
              <Target className="h-4 w-4 text-brand-600" />
            </div>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-3xl font-bold text-navy-800">{user.todayMinutes}<span className="text-base font-medium text-navy-400">/{user.dailyGoalMinutes}m</span></p>
              <Badge tone={goalPct >= 100 ? 'success' : 'brand'}>{goalPct}%</Badge>
            </div>
            <div className="mt-3">
              <ProgressBar value={goalPct} tone={goalPct >= 100 ? 'success' : 'brand'} />
            </div>
            <p className="mt-3 text-xs text-navy-500">
              <Flame className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
              {DEMO_PROGRESS.streakDays}-day streak — keep it up!
            </p>
          </Card>

          <Card>
            <h2 className="section-title">This week</h2>
            <div className="mt-4 flex h-28 items-end justify-between gap-2">
              {DEMO_WEEKLY_MINUTES.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md bg-brand-500/80 transition-all"
                    style={{ height: `${(d.minutes / maxWeekly) * 100}%` }}
                    title={`${d.minutes} min`}
                  />
                  <span className="text-[10px] text-navy-400">{d.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Recommended exercises</h2>
          <button onClick={() => onNavigate('speaking')} className="btn-soft">
            Start practicing <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RECOMMENDED_EXERCISES.map((r) => {
            const Icon = activityIcon[r.type];
            return (
              <button
                key={r.id}
                onClick={() => onNavigate(recommendedNav[r.type])}
                className="group flex items-center gap-3 rounded-xl border border-navy-100 p-4 text-left transition hover:border-brand-200 hover:bg-brand-50/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-800">{r.title}</p>
                  <p className="text-xs text-navy-500">{r.level} · {r.minutes} min</p>
                </div>
                <ArrowRight className="h-4 w-4 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
