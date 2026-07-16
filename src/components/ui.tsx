import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function GlassCard({
  children, className = '', hover = false,
}: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass-card ${hover ? 'glass-hover' : ''} ${className}`}>{children}</div>
  );
}

export function StatCard({
  icon, label, value, trend, accent = 'accent',
}: {
  icon: ReactNode; label: string; value: string; trend?: string;
  accent?: 'accent' | 'emergency' | 'emerald' | 'amber';
}) {
  const colorMap = {
    accent: 'text-electric-400 bg-electric-500/10 border-electric-500/30',
    emergency: 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard hover className="p-5">
        <div className="flex items-start justify-between">
          <span className={`grid place-items-center w-11 h-11 rounded-xl border ${colorMap[accent]}`}>
            {icon}
          </span>
          {trend && <span className="text-xs text-emerald-400 font-medium">{trend}</span>}
        </div>
        <div className="mt-4 text-3xl font-display font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400 mt-1">{label}</div>
      </GlassCard>
    </motion.div>
  );
}

export function SeverityMeter({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    v >= 80 ? 'from-emergency-500 to-emergency-600'
    : v >= 60 ? 'from-orange-500 to-emergency-500'
    : v >= 40 ? 'from-amber-500 to-orange-500'
    : 'from-emerald-500 to-electric-500';
  const label = v >= 80 ? 'Critical' : v >= 60 ? 'High' : v >= 40 ? 'Moderate' : 'Low';
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-400">AI Severity Score</span>
        <span className="font-mono font-semibold text-white">{v}/100 · {label}</span>
      </div>
      <div className="h-3 rounded-full bg-command-surface border border-command-border overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-10 text-center">
      <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-slate-400">
      <Loader2 className="w-5 h-5 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function SectionHeader({
  eyebrow, title, subtitle,
}: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="section-label mb-3">{eyebrow}</p>}
      <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
        {title}
      </h2>
      {subtitle && <p className="text-slate-400 mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function LiveBadge({ label = 'Live', tone = 'emerald' }: { label?: string; tone?: 'emerald' | 'emergency' | 'electric' }) {
  return (
    <span className={`chip border ${
      tone === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : tone === 'emergency' ? 'border-emergency-500/30 bg-emergency-500/10 text-emergency-300'
      : 'border-electric-500/30 bg-electric-500/10 text-electric-300'
    }`}>
      <span className={`live-dot live-dot-${tone}`} />
      {label}
    </span>
  );
}

export function ProgressBar({ value, color = 'electric' }: { value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    electric: 'from-electric-500 to-electric-400',
    emergency: 'from-emergency-500 to-emergency-400',
    emerald: 'from-emerald-500 to-emerald-400',
    amber: 'from-amber-500 to-amber-400',
  };
  return (
    <div className="h-1.5 rounded-full bg-command-surface border border-command-border overflow-hidden">
      <motion.div
        className={`h-full bg-gradient-to-r ${colorMap[color] || colorMap.electric} rounded-full`}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
