import { BarChart3, BookOpen, GraduationCap, Home, Mic, Settings as SettingsIcon, Sparkles, PenLine, LogOut } from 'lucide-react';
import type { PageKey } from '@/types';
import { useDemo } from '@/context/DemoContext';

const NAV: { key: PageKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'speaking', label: 'AI Speaking Tutor', icon: Sparkles },
  { key: 'pronunciation', label: 'Pronunciation Lab', icon: Mic },
  { key: 'writing', label: 'Writing Checker', icon: PenLine },
  { key: 'cefr', label: 'CEFR Practice', icon: GraduationCap },
  { key: 'progress', label: 'Learning Progress', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar({ current, onNavigate }: { current: PageKey; onNavigate: (p: PageKey) => void }) {
  const { user, exitDemo } = useDemo();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-navy-100 bg-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-navy-800">SpeakUz AI</p>
          <p className="text-[11px] text-navy-500">English for Uzbekistan</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = current === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? 'bg-brand-50 text-brand-700' : 'text-navy-600 hover:bg-navy-50'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${active ? 'text-brand-600' : 'text-navy-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-navy-100 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {user?.name?.charAt(0) ?? 'D'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy-700">{user?.name}</p>
            <p className="truncate text-[11px] text-navy-500">Demo account</p>
          </div>
        </div>
        <button
          onClick={exitDemo}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-navy-500 transition hover:bg-navy-50 hover:text-navy-700"
        >
          <LogOut className="h-4 w-4" /> Exit demo
        </button>
      </div>
    </aside>
  );
}
