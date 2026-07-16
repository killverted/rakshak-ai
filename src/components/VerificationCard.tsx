import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, Clock, Gauge, Copy, CheckCircle2,
  AlertTriangle, Fingerprint, Users,
} from 'lucide-react';
import { GlassCard } from './ui';

export function TrustScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'md' }) {
  const color =
    score >= 70 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : score >= 40 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    : 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30';

  const icon =
    score >= 70 ? <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
    : score >= 40 ? <Clock className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
    : <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`chip border rounded-full inline-flex items-center gap-1 ${color} ${padding}`}>
      {icon} {score}/100
    </span>
  );
}

export function VerificationStatusBadge({ status }: { status: string }) {
  const config = {
    verified: { label: 'Verified', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: <ShieldCheck className="w-3 h-3" /> },
    pending: { label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: <Clock className="w-3 h-3" /> },
    suspicious: { label: 'Suspicious', color: 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30', icon: <ShieldAlert className="w-3 h-3" /> },
  };
  const c = config[status as keyof typeof config] || config.pending;
  return (
    <span className={`chip border rounded-full inline-flex items-center gap-1 ${c.color} px-2 py-0.5 text-[10px]`}>
      {c.icon} {c.label}
    </span>
  );
}

export function VerificationCard({
  trustScore,
  status,
  aiConfidence,
  imageAuthenticity,
  reporterScore,
  nearbyCount,
  isDuplicate,
}: {
  trustScore: number;
  status: string;
  aiConfidence: number;
  imageAuthenticity: number;
  reporterScore: number;
  nearbyCount: number;
  isDuplicate: boolean;
}) {
  const factors = [
    { label: 'AI Confidence', value: aiConfidence, icon: <Gauge className="w-3.5 h-3.5" />, color: 'electric' },
    { label: 'Image Authenticity', value: imageAuthenticity, icon: <Fingerprint className="w-3.5 h-3.5" />, color: 'emerald' },
    { label: 'Reporter Trust', value: reporterScore, icon: <Users className="w-3.5 h-3.5" />, color: 'amber' },
    { label: 'Nearby Reports', value: Math.min(100, nearbyCount * 20), icon: <Copy className="w-3.5 h-3.5" />, color: 'emergency' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-electric-400" />
            Incident Verification
          </h3>
          <VerificationStatusBadge status={status} />
        </div>

        {/* Trust Score Gauge */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1e293b" strokeWidth="6" />
              <motion.circle
                cx="40" cy="40" r="34" fill="none"
                stroke={trustScore >= 70 ? '#10b981' : trustScore >= 40 ? '#f59e0b' : '#ef4444'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(trustScore / 100) * 213.6} 213.6`}
                initial={{ strokeDasharray: '0 213.6' }}
                animate={{ strokeDasharray: `${(trustScore / 100) * 213.6} 213.6` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-xl font-bold text-white font-mono">{trustScore}</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-400 mb-1">Trust Score</div>
            <div className="text-sm font-semibold text-white">
              {trustScore >= 70 ? 'High Confidence' : trustScore >= 40 ? 'Moderate Confidence' : 'Low Confidence'}
            </div>
            {isDuplicate && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">
                <Copy className="w-3 h-3" /> Possible duplicate detected
              </div>
            )}
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="space-y-2.5">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center gap-2.5">
              <span className="text-slate-500">{f.icon}</span>
              <span className="text-xs text-slate-400 flex-1">{f.label}</span>
              <div className="w-20 h-1.5 rounded-full bg-command-surface border border-command-border overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: f.color === 'electric' ? '#38bdf8' : f.color === 'emerald' ? '#10b981' : f.color === 'amber' ? '#f59e0b' : '#ef4444',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, f.value))}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-mono text-white w-8 text-right">{f.value}%</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}
