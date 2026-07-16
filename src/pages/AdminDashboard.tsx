import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Activity, AlertTriangle, Users, Clock, TrendingUp,
  Radio, MapPin, ShieldCheck, Server, Cpu, Zap, Brain,
  FileText, UserCheck, Building2,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, Spinner, LiveBadge, ProgressBar } from '../components/ui';
import { BarChart, Donut, LineChart } from '../components/charts';
import { supabase, type Report, type ActivityEntry, SEVERITY_COLORS, STATUS_COLORS } from '../lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: r }, { data: a }] = await Promise.all([
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
      ]);
      setReports((r as Report[]) ?? []);
      setActivity((a as ActivityEntry[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { pending: 0, triaged: 0, responding: 0, resolved: 0 };
    reports.forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return map;
  }, [reports]);

  const donutSegments = [
    { label: 'Pending', value: byStatus.pending, color: '#64748b' },
    { label: 'Triaged', value: byStatus.triaged, color: '#38bdf8' },
    { label: 'Responding', value: byStatus.responding, color: '#f97316' },
    { label: 'Resolved', value: byStatus.resolved, color: '#22c55e' },
  ];

  const weeklyData = [12, 19, 8, 24, 31, 18, 27];
  const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trendData = [40, 52, 48, 61, 58, 72, 68, 81, 76, 88, 92, 84];
  const trendLabels = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

  const systemMetrics = [
    { icon: Cpu, label: 'AI inference', value: 'Operational', color: 'text-emerald-400', pct: 99 },
    { icon: Zap, label: 'API latency', value: '1.8s', color: 'text-emerald-400', pct: 96 },
    { icon: ShieldCheck, label: 'RLS policies', value: 'Enforced', color: 'text-emerald-400', pct: 100 },
    { icon: Radio, label: 'SOS pipeline', value: 'Streaming', color: 'text-emerald-400', pct: 99 },
  ];

  return (
    <div className="min-h-screen pt-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-emergency-500/10 border border-emergency-500/30 shadow-glow">
            <LayoutDashboard className="w-6 h-6 text-emergency-400" />
          </span>
          <div>
            <p className="section-label mb-1">Command Center</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Admin Dashboard</h1>
          </div>
          <div className="ml-auto"><LiveBadge label="Live" tone="emerald" /></div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: AlertTriangle, label: 'Active incidents', value: `${byStatus.pending + byStatus.responding}`, accent: 'emergency' as const, trend: '+12%' },
            { icon: Brain, label: 'AI alerts', value: `${reports.filter(r => r.ai_severity !== null).length}`, accent: 'electric' as const, trend: '+5' },
            { icon: Users, label: 'Rescue teams', value: '342', accent: 'emerald' as const, trend: '+8%' },
            { icon: FileText, label: 'Reports received', value: `${reports.length}`, accent: 'amber' as const, trend: '+24%' },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}>
              <GlassCard hover className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`grid place-items-center w-11 h-11 rounded-xl border ${
                    s.accent === 'emergency' ? 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30'
                    : s.accent === 'electric' ? 'text-electric-400 bg-electric-500/10 border-electric-500/30'
                    : s.accent === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">{s.trend}</span>
                </div>
                <div className="mt-4 text-3xl font-display font-bold text-white">{s.value}</div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Clock, label: 'Response time', value: '6.4m', sub: 'avg this week' },
            { icon: UserCheck, label: 'People assisted', value: '93.5K', sub: 'cumulative' },
            { icon: TrendingUp, label: 'Incident trend', value: '+24%', sub: 'vs last quarter' },
            { icon: Building2, label: 'Zones covered', value: '28', sub: 'states & UTs' },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 + i * 0.05 }}>
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <s.icon className="w-4 h-4 text-slate-500" />
                  <div className="flex-1">
                    <div className="text-lg font-display font-bold text-white">{s.value}</div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 mt-2">{s.sub}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
            <GlassCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-semibold text-white">Incident trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Weekly incidents over 12 weeks</p>
                </div>
                <span className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                  <TrendingUp className="w-3.5 h-3.5" /> +24%
                </span>
              </div>
              <LineChart data={trendData} labels={trendLabels} />
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.35 }}>
            <GlassCard className="p-6">
              <h3 className="font-display font-semibold text-white mb-1">Status breakdown</h3>
              <p className="text-xs text-slate-400 mb-5">Incidents by response status</p>
              <Donut segments={donutSegments} />
            </GlassCard>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.4 }}>
            <GlassCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-semibold text-white">Weekly incidents</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Reports filed per day this week</p>
                </div>
                <span className="chip border border-white/10 bg-white/5 text-slate-300">7 days</span>
              </div>
              <BarChart data={weeklyData} labels={weeklyLabels} />
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.45 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Server className="w-4 h-4 text-electric-400" />
                <h3 className="font-display font-semibold text-white">System health</h3>
              </div>
              <div className="space-y-3">
                {systemMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-slate-300">
                        <m.icon className="w-3.5 h-3.5 text-slate-500" /> {m.label}
                      </span>
                      <span className={`font-mono text-xs ${m.color}`}>{m.value}</span>
                    </div>
                    <ProgressBar value={m.pct} color="emerald" />
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Incident cards + live activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionHeader title="Recent incidents" subtitle="Latest reports across all categories." />
            {loading ? <Spinner label="Loading incidents…" /> : (
              <div className="grid sm:grid-cols-2 gap-3">
                {reports.slice(0, 6).map((r, i) => (
                  <motion.div key={r.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                    <GlassCard hover className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-display font-semibold text-white">{r.disaster_type}</h3>
                        <span className={`chip border ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">{r.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        {r.location_label && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="w-3 h-3" /> {r.location_label.split('—')[0]}
                          </span>
                        )}
                        <span className={`chip border ${STATUS_COLORS[r.status]} text-[10px] px-2 py-0.5`}>{r.status}</span>
                      </div>
                      {r.ai_severity !== null && (
                        <div className="mt-3 pt-3 border-t border-command-border">
                          <div className="flex items-center gap-1.5 text-xs text-electric-400 mb-1.5">
                            <Brain className="w-3 h-3" /> AI Severity: {r.ai_severity}/100
                          </div>
                          <ProgressBar value={r.ai_severity} color="electric" />
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeader title="Live activity" />
            <GlassCard className="p-5">
              {loading ? <Spinner label="Loading activity…" /> : (
                <div className="space-y-1 max-h-[560px] overflow-y-auto no-scrollbar">
                  {activity.map((a, i) => (
                    <motion.div key={a.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition">
                      <span className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 border ${
                        a.severity === 'critical' ? 'bg-emergency-500/10 border-emergency-500/30 text-emergency-400'
                        : a.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        : a.severity === 'moderate' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-electric-500/10 border-electric-500/30 text-electric-400'
                      }`}>
                        <Activity className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium">{a.action}</div>
                        {a.detail && <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{a.detail}</div>}
                        <div className="text-[10px] text-slate-500 mt-1">
                          {a.actor} · {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
