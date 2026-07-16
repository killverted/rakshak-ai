import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Heart, Award, Activity, MapPin, CheckCircle2, Clock,
  TrendingUp, Radio, Zap, ShieldCheck, LifeBuoy, Target, ArrowUpRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, Spinner, ProgressBar } from '../components/ui';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { supabase, type Volunteer } from '../lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

// Availability enum → styled chip mapping (emerald primary, electric secondary)
const AVAILABILITY_STYLES: Record<string, string> = {
  available: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  'on-mission': 'text-electric-300 bg-electric-500/10 border-electric-500/30',
  offline: 'text-slate-400 bg-white/5 border-white/15',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  available: 'Available',
  'on-mission': 'On mission',
  offline: 'Offline',
};

type Severity = 'critical' | 'high' | 'moderate' | 'low';

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'text-emergency-300 bg-emergency-500/10 border-emergency-500/30',
  high: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  moderate: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  low: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
};

type Mission = {
  name: string;
  location: string;
  severity: Severity;
  needed: number;
  assigned: number;
  skills: string[];
  eta: string;
};

const OPEN_MISSIONS: Mission[] = [
  {
    name: 'Flood rescue — Mithi River banks',
    location: 'Mumbai West, Maharashtra',
    severity: 'critical',
    needed: 12,
    assigned: 7,
    skills: ['Swiftwater Rescue', 'Swimming', 'First Aid'],
    eta: 'Deploying now',
  },
  {
    name: 'Medical relief camp setup',
    location: 'Nagpur Old City, Maharashtra',
    severity: 'high',
    needed: 8,
    assigned: 3,
    skills: ['Medical', 'Triage', 'Logistics'],
    eta: 'ETA 45 min',
  },
  {
    name: 'Relief supply distribution',
    location: 'Chennai Coastal Belt, Tamil Nadu',
    severity: 'high',
    needed: 10,
    assigned: 6,
    skills: ['Logistics', 'Driving', 'Coordination'],
    eta: 'ETA 1.2h',
  },
  {
    name: 'Landslide clearance support',
    location: 'Pune Western Ghats, Maharashtra',
    severity: 'moderate',
    needed: 6,
    assigned: 4,
    skills: ['Rescue', 'Heavy Equipment', 'Logistics'],
    eta: 'ETA 2h',
  },
];

type ImpactMetric = {
  label: string;
  value: number;
  display: string;
  color: string;
  icon: typeof Users;
};

const IMPACT_METRICS: ImpactMetric[] = [
  { label: 'People assisted', value: 87, display: '93,500', color: 'emerald', icon: Heart },
  { label: 'Relief camps operated', value: 72, display: '428', color: 'electric', icon: ShieldCheck },
  { label: 'Missions success rate', value: 94, display: '94%', color: 'emerald', icon: Target },
  { label: 'Volunteer coverage', value: 81, display: '81%', color: 'electric', icon: Zap },
];

export function VolunteerDashboard() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('volunteers')
        .select('*')
        .order('created_at', { ascending: false });
      setVolunteers((data as Volunteer[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const available = volunteers.filter((v) => v.availability === 'available').length;
    const totalMissions = volunteers.reduce((s, v) => s + (v.missions_completed ?? 0), 0);
    // Response time scales with active coverage; mock premium metric
    const responseTime = available > 0 ? Math.max(3.2, 9.6 - available * 0.4).toFixed(1) : '—';
    return {
      active: available,
      missions: totalMissions,
      assisted: totalMissions * 1180, // premium derived impact metric
      responseTime,
    };
  }, [volunteers]);

  const statCards = [
    { icon: Users, label: 'Active volunteers', value: `${stats.active}`, accent: 'emerald', trend: 'live' },
    { icon: CheckCircle2, label: 'Missions completed', value: `${stats.missions}`, accent: 'electric', trend: '+12%' },
    { icon: Heart, label: 'People assisted', value: stats.assisted.toLocaleString(), accent: 'emerald', trend: '+8%' },
    { icon: Clock, label: 'Avg response time', value: `${stats.responseTime}m`, accent: 'electric', trend: '-18%' },
  ] as const;

  return (
    <div className="min-h-screen pt-20 bg-command-bg">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <p className="section-label mb-2 flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-400" /> Command Center · Volunteer Ops
            </p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Disaster Response Command
            </h1>
            <p className="text-slate-400 mt-1.5">
              Welcome, {user?.email?.split('@')[0] ?? 'Commander'} — coordinate the responder force, track active missions, and measure network impact.
            </p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.08 }} className="flex gap-2">
            <button onClick={() => navigate('map')} className="btn-ghost px-4 py-2.5 text-sm">
              <MapPin className="w-4 h-4" /> Live map
            </button>
            <button onClick={() => navigate('report')} className="btn-accent px-4 py-2.5 text-sm">
              <Zap className="w-4 h-4" /> New deployment
            </button>
          </motion.div>
        </div>

        {/* Status banner */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 mb-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-6 w-56 h-56 bg-emerald-500/15 rounded-full blur-[90px]" />
            <div className="absolute -bottom-16 left-10 w-48 h-48 bg-electric-500/10 rounded-full blur-[80px]" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-glow">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="font-display font-bold text-xl text-white">Network Status: Operational</h2>
                  <span className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <span className="live-dot live-dot-emerald" /> {stats.active} responders online
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {OPEN_MISSIONS.length} open missions · {OPEN_MISSIONS.reduce((s, m) => s + Math.max(0, m.needed - m.assigned), 0)} additional volunteers required.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Activity className="w-4 h-4 text-emerald-400" />
                Synced {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.12 + i * 0.06 }}>
              <GlassCard hover className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`grid place-items-center w-11 h-11 rounded-xl border ${
                    s.accent === 'emerald'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-electric-400 bg-electric-500/10 border-electric-500/30'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </span>
                  {s.trend && (
                    <span className={`text-xs font-medium ${s.trend === 'live' ? 'text-emerald-400 flex items-center gap-1' : 'text-emerald-400'}`}>
                      {s.trend === 'live' && <span className="live-dot live-dot-emerald" />}
                      {s.trend}
                    </span>
                  )}
                </div>
                <div className="mt-4 text-3xl font-display font-bold text-white">{s.value}</div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Volunteer roster */}
          <div className="lg:col-span-2">
            <SectionHeader
              eyebrow="Field Force"
              title="Volunteer roster"
              subtitle="Verified responders with skills, availability, and mission history."
            />
            {loading ? (
              <GlassCard className="p-6">
                <Spinner label="Loading volunteer network…" />
              </GlassCard>
            ) : volunteers.length === 0 ? (
              <GlassCard className="p-10 text-center">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-sm text-slate-400">No volunteers registered yet. Deploy your first responder to begin.</p>
              </GlassCard>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {volunteers.map((v, i) => (
                  <motion.div key={v.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                    <GlassCard hover className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-electric-500/10 border border-emerald-500/30 font-display font-bold text-white shrink-0">
                            {v.name.charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-display font-semibold text-white truncate">{v.name}</h3>
                            {v.region && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{v.region}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`chip border shrink-0 ${AVAILABILITY_STYLES[v.availability] ?? AVAILABILITY_STYLES.offline}`}>
                          {AVAILABILITY_LABEL[v.availability] ?? v.availability}
                        </span>
                      </div>

                      {v.skills && v.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {v.skills.slice(0, 4).map((s) => (
                            <span key={s} className="chip border border-white/10 bg-white/5 text-slate-300 text-[10px] px-2 py-0.5">
                              {s}
                            </span>
                          ))}
                          {v.skills.length > 4 && (
                            <span className="chip border border-white/10 bg-white/5 text-slate-500 text-[10px] px-2 py-0.5">
                              +{v.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono font-semibold text-white">{v.missions_completed ?? 0}</span> missions
                        </div>
                        {v.phone && (
                          <div className="text-xs font-mono text-slate-500">{v.phone}</div>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Open missions + network impact */}
          <div className="space-y-6">
            {/* Open missions */}
            <div>
              <SectionHeader eyebrow="Active Operations" title="Open missions" subtitle="Deployments awaiting volunteer assignment." />
              <div className="space-y-3">
                {OPEN_MISSIONS.map((m, i) => {
                  const fillPct = m.needed > 0 ? Math.min(100, Math.round((m.assigned / m.needed) * 100)) : 0;
                  return (
                    <motion.div key={m.name} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}>
                      <GlassCard hover className="p-5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display font-semibold text-white text-sm leading-tight">{m.name}</h3>
                          <span className={`chip border shrink-0 text-[10px] px-2 py-0.5 ${SEVERITY_STYLES[m.severity]}`}>
                            {m.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {m.location}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {m.skills.map((s) => (
                            <span key={s} className="chip border border-white/10 bg-white/5 text-slate-300 text-[10px] px-2 py-0.5">
                              {s}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {m.assigned}/{m.needed} assigned
                            </span>
                            <span className="text-electric-300 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {m.eta}
                            </span>
                          </div>
                          <ProgressBar value={fillPct} color={m.severity === 'critical' ? 'emergency' : 'emerald'} />
                        </div>

                        <button className="btn-ghost w-full mt-4 py-2 text-xs">
                          <LifeBuoy className="w-3.5 h-3.5" /> Accept mission <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Network impact */}
            <div>
              <SectionHeader eyebrow="Outcomes" title="Network impact" subtitle="Cumulative reach of the volunteer force." />
              <GlassCard className="p-6 relative overflow-hidden">
                <div className="absolute -top-10 right-0 w-40 h-40 bg-emerald-500/15 rounded-full blur-[70px]" />
                <div className="relative space-y-5">
                  {IMPACT_METRICS.map((m) => (
                    <div key={m.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-sm text-slate-300">
                          <m.icon className={`w-4 h-4 ${m.color === 'emerald' ? 'text-emerald-400' : 'text-electric-400'}`} />
                          {m.label}
                        </span>
                        <span className="font-mono font-bold text-white text-sm">{m.display}</span>
                      </div>
                      <ProgressBar value={m.value} color={m.color} />
                    </div>
                  ))}

                  <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      Trending upward across all regions
                    </div>
                    <span className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px] px-2 py-0.5">
                      <span className="live-dot live-dot-emerald" /> Live
                    </span>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Command CTA */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
              <GlassCard hover className="p-6 relative overflow-hidden">
                <div className="absolute -top-10 -right-6 w-44 h-44 bg-electric-500/20 rounded-full blur-[70px]" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-electric-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-electric-300">Command</span>
                  </div>
                  <h3 className="font-display font-bold text-white text-lg">Need to broadcast?</h3>
                  <p className="text-sm text-slate-400 mt-1">Issue an SOS or deploy a new mission to the entire responder network.</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => navigate('sos')} className="btn-primary flex-1 py-3 text-sm">
                      <Radio className="w-4 h-4" /> Broadcast
                    </button>
                    <button onClick={() => navigate('report')} className="btn-ghost px-4 py-3 text-sm">
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
