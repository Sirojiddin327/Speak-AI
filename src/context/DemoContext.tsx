import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CefrLevel, DemoUser } from '@/types';
import { DEMO_USER } from '@/services/demoData';

interface DemoContextValue {
  user: DemoUser | null;
  isDemo: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  setDailyGoal: (minutes: number) => void;
  setCefrLevel: (level: CefrLevel) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  const value = useMemo<DemoContextValue>(
    () => ({
      user,
      isDemo: Boolean(user?.isDemo),
      enterDemo: () => setUser({ ...DEMO_USER }),
      exitDemo: () => setUser(null),
      setDailyGoal: (minutes) =>
        setUser((u) => (u ? { ...u, dailyGoalMinutes: Math.max(5, Math.min(120, minutes)) } : u)),
      setCefrLevel: (level) => setUser((u) => (u ? { ...u, cefrLevel: level } : u)),
    }),
    [user],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoProvider');
  return ctx;
}
