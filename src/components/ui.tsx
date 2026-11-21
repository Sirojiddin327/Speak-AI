import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-6 flex items-start gap-3 animate-fade-in">
      {Icon && (
        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'success' | 'warning' | 'error' | 'neutral' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-rose-50 text-rose-700',
    neutral: 'bg-navy-50 text-navy-600',
  };
  return <span className={`badge ${tones[tone]}`}>{children}</span>;
}

export function DemoBanner() {
  return (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 animate-fade-in">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">Demo mode</p>
        <p className="mt-0.5 text-amber-700">
          No AI API key is configured. Responses shown are transparent fallback examples generated from simple rules — they are <span className="font-semibold">not real AI analysis</span>. Add <code className="rounded bg-amber-100 px-1">VITE_AI_API_URL</code> and <code className="rounded bg-amber-100 px-1">VITE_AI_API_KEY</code> to enable live AI.
        </p>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'success' | 'warning' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
      <div
        className={`h-full rounded-full ${tones[tone]} transition-all duration-700`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, accent = 'brand' }: { label: string; value: ReactNode; icon: React.ComponentType<{ className?: string }>; accent?: 'brand' | 'success' | 'amber' }) {
  const accents: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <Card className="animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-sm text-navy-500">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${accents[accent]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-navy-800">{value}</p>
    </Card>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600 ${className}`}
    />
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-100 bg-navy-50/40 p-8 text-center">
      <p className="text-sm font-semibold text-navy-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' }) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : 'btn-soft';
  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  );
}
