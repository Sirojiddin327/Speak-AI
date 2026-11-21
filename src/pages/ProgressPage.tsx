import { Activity, BarChart3, Clock, Flame, GraduationCap, Mic, PenLine, Sparkles, Target } from 'lucide-react';
import { PageHeader, Card, Badge, ProgressBar, StatCard } from '@/components/ui';
import { DEMO_ACTIVITIES, DEMO_PROGRESS, DEMO_WEEKLY_MINUTES } from '@/services/demoData';

export function ProgressPage() {
  const maxWeekly = Math.max(...DEMO_WEEKLY_MINUTES.map((d) => d.minutes));
  const totalWeek = DEMO_WEEKLY_MINUTES.reduce((a, b) => a + b.minutes, 0);
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];

  const activityIcon = { speaking: Sparkles, writing: PenLine, pronunciation: Mic, cefr: GraduationCap };

  return (
    <div>
      <PageHeader title="Learning Progress" subtitle="Your English practice activity over time." icon={BarChart3} />

      <div className="mb-5 flex items-start gap-3 rounded-xl border border-navy-100 bg-navy-50/40 p-3 text-sm text-navy-600">
        <Activity className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
        <p>The charts below use <span className="font-semibold">explicitly labeled demo data</span> to illustrate what real progress tracking will look like once connected to a live account.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total practice" value={`${DEMO_PROGRESS.totalPracticeMinutes}m`} icon={Clock} />
        <StatCard label="Speaking sessions" value={DEMO_PROGRESS.speakingSessions} icon={Sparkles} accent="success" />
        <StatCard label="Writing submissions" value={DEMO_PROGRESS.writingSubmissions} icon={PenLine} accent="amber" />
        <StatCard label="Day streak" value={DEMO_PROGRESS.streakDays} icon={Flame} accent="amber" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="section-title">Weekly activity (minutes)</h2>
            <Badge tone="neutral">Demo data</Badge>
          </div>
          <div className="mt-5 flex h-44 items-end justify-between gap-3">
            {DEMO_WEEKLY_MINUTES.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-navy-600">{d.minutes}</span>
                <div className="flex w-full items-end" style={{ height: '120px' }}>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all"
                    style={{ height: `${(d.minutes / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-navy-400">{d.day}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-navy-500">Total this week: {totalWeek} minutes</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="section-title">Speaking & writing scores (7 weeks)</h2>
            <Badge tone="neutral">Demo data</Badge>
          </div>
          <div className="mt-5">
            <LineChart data={DEMO_PROGRESS.speakingTrend} labels={weeks} max={100} color="#1b56db" label="Speaking" />
            <div className="mt-4">
              <LineChart data={DEMO_PROGRESS.writingTrend} labels={weeks} max={100} color="#10b981" label="Writing" />
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Activity history</h2>
            <Badge tone="neutral">Demo data</Badge>
          </div>
          <div className="mt-4 space-y-2">
            {DEMO_ACTIVITIES.map((a) => {
              const Icon = activityIcon[a.type];
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-navy-100 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></div>
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
            <h2 className="section-title">Learning goals</h2>
            <div className="mt-3 space-y-3">
              <GoalRow icon={Target} label="Daily practice goal" value="20 min/day" pct={70} />
              <GoalRow icon={Sparkles} label="Speaking score target" value="Reach 85" pct={Math.round((DEMO_PROGRESS.speakingTrend[DEMO_PROGRESS.speakingTrend.length - 1]! / 85) * 100)} />
              <GoalRow icon={GraduationCap} label="Move to B2 level" value="Complete B1 practice" pct={60} />
              <GoalRow icon={PenLine} label="Write 3 essays/week" value="2 of 3 this week" pct={66} />
            </div>
          </Card>

          <Card>
            <h2 className="section-title">Skill breakdown</h2>
            <div className="mt-3 space-y-3">
              <SkillRow icon={Sparkles} label="Speaking" value={DEMO_PROGRESS.speakingSessions} />
              <SkillRow icon={PenLine} label="Writing" value={DEMO_PROGRESS.writingSubmissions} />
              <SkillRow icon={Mic} label="Pronunciation" value={DEMO_PROGRESS.pronunciationDrills} />
              <SkillRow icon={GraduationCap} label="CEFR tests" value={DEMO_PROGRESS.cefrTests} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LineChart({ data, labels, color, label }: { data: number[]; labels: string[]; max: number; color: string; label: string }) {
  const max = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 100}`).join(' ');
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 text-xs">
        <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
        <span className="font-medium text-navy-600">{label}</span>
      </div>
      <div className="relative h-28 w-full rounded-lg bg-navy-50/40">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-1 pb-1 text-[9px] text-navy-400">
          {labels.map((l) => <span key={l}>{l}</span>)}
        </div>
      </div>
    </div>
  );
}

function GoalRow({ icon: Icon, label, value, pct }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; pct: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-navy-700"><Icon className="h-4 w-4 text-brand-500" /> {label}</span>
        <span className="text-xs text-navy-500">{value}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}

function SkillRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-navy-700"><Icon className="h-4 w-4 text-navy-400" /> {label}</span>
      <span className="font-semibold text-navy-800">{value}</span>
    </div>
  );
}
