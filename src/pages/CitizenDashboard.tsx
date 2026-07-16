import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Siren, FileText, Brain, MapPin, Activity, ShieldCheck, TrendingUp,
  AlertTriangle, ChevronRight, LifeBuoy, Radio, Bell, ArrowUpRight,
  CloudRain, Building2, Phone, Clock, Users, Zap, Navigation,
  Gauge,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, EmptyState, Spinner, ProgressBar } from '../components/ui';
import { TrustScoreBadge, VerificationStatusBadge } from '../components/VerificationCard';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { supabase, type Report, SEVERITY_COLORS, STATUS_COLORS } from '../lib/supabase';
import { getOrCreateProfile } from '../lib/verification';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const SHELTERS = [
  { name: 'Govt High School, Sector 12', distance: '1.2 km', capacity: '450 people', status: 'Open' },
  { name: 'Community Center, Lake Road', distance: '2.8 km', capacity: '220 people', status: 'Open' },
  { name: 'Stadium Complex, North Block', distance: '4.1 km', capacity: '800 people', status: 'Filling' },
];

const CONTACTS = [
  { label: 'NDRF', number: '1070' },
  { label: 'Fire', number: '101' },
  { label: 'Ambulance', number: '108' },
  { label: 'Helpline', number: '112' },
];

const WEATHER_ALERTS = [
  { icon: CloudRain, title: 'Heavy rainfall warning', desc: 'Expected 80–120mm in next 24 hours. Risk of urban flooding in low-lying areas.', tone: 'high' },
  { icon: Zap, title: 'Thunderstorm advisory', desc: 'Lightning activity detected in your district. Avoid open areas and tall structures.', tone: 'moderate' },
];

const RECOMMENDATIONS = [
  { icon: LifeBuoy, title: 'Move to higher ground', desc: 'Flood levels rising in your zone. Evacuate to designated shelters immediately.', tone: 'critical' },
  { icon: Radio, title: 'Tune to emergency broadcast', desc: 'Monitor 107.8 MHz for official instructions and evacuation routes.', tone: 'high' },
  { icon: ShieldCheck, title: 'Keep emergency kit ready', desc: 'Store water, documents, flashlight, and first-aid in a waterproof bag.', tone: 'moderate' },
];

export function CitizenDashboard() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [trustScore, setTrustScore] = useState<number>(50);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setReports((data as Report[]) ?? []);
      setLoading(false);

      if (user?.id) {
        const score = await getOrCreateProfile(user.id);
        setTrustScore(score);
      }
    })();
  }, [user?.id]);

  const nearbyIncidents = useMemo(() => reports.filter(r => r.status !== 'resolved').slice(0, 4), [reports]);

  return (
    <div className="min-h-screen pt-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="section-label mb-2">Citizen Dashboard</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Welcome back, {user?.email?.split('@')[0] ?? 'Citizen'}
            </h1>
            <p className="text-slate-400 mt-1.5">Your personal emergency response overview.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('report')} className="btn-accent px-4 py-2.5 text-sm">
              <FileText className="w-4 h-4" /> Report disaster
            </button>
            <button onClick={() => navigate('sos')} className="btn-primary px-4 py-2.5 text-sm">
              <Siren className="w-4 h-4" /> SOS
            </button>
          </div>
        </div>

        {/* Safety status banner */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <GlassCard className="p-6 mb-6 relative overflow-hidden">
            <div className="absolute -top-10 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-[80px]" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-glow-amber">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-display font-bold text-xl text-white">Zone Status: Watch</h2>
                  <span className="chip border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    <span className="live-dot live-dot-emerald" /> Active monitoring
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">Heavy rainfall warning active. Stay alert and monitor official channels.</p>
              </div>
              <button onClick={() => navigate('map')} className="btn-ghost px-4 py-2.5 text-sm">
                <Navigation className="w-4 h-4" /> View map
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Your reports', value: `${reports.length}`, accent: 'electric' as const },
            { icon: AlertTriangle, label: 'Active incidents', value: `${nearbyIncidents.length}`, accent: 'emergency' as const, trend: '+1' },
            { icon: Clock, label: 'Avg response', value: '6.4m', accent: 'amber' as const, trend: '-18%' },
            { icon: ShieldCheck, label: 'Zone status', value: 'Watch', accent: 'amber' as const },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}>
              <GlassCard hover className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`grid place-items-center w-11 h-11 rounded-xl border ${
                    s.accent === 'electric' ? 'text-electric-400 bg-electric-500/10 border-electric-500/30'
                    : s.accent === 'emergency' ? 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <s.icon className="w-5 h-5" />
                  </span>
                  {s.trend && <span className="text-xs text-emerald-400 font-medium">{s.trend}</span>}
                </div>
                <div className="mt-4 text-3xl font-display font-bold text-white">{s.value}</div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Trust Score Card */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-14 h-14 rounded-xl bg-electric-500/10 border border-electric-500/30 shadow-glow">
                <Gauge className="w-7 h-7 text-electric-400" />
              </span>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-white">Your Reporter Trust Score</h3>
                <p className="text-sm text-slate-400 mt-0.5">Earn +5 for verified reports, lose -10 for rejected ones.</p>
              </div>
              <TrustScoreBadge score={trustScore} size="md" />
            </div>
            <div className="mt-4">
              <ProgressBar value={trustScore} color="electric" />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                <span>0 — Untrusted</span>
                <span>50 — Default</span>
                <span>100 — Trusted</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: recent reports + nearby incidents */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <SectionHeader title="Recent reports" subtitle="Latest disaster reports across the network." />
              {loading ? <Spinner label="Loading reports…" /> : reports.length === 0 ? (
                <EmptyState message="No reports yet. Be the first to report an incident." />
              ) : (
                <div className="space-y-3">
                  {reports.map((r, i) => (
                    <motion.div key={r.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                      <GlassCard hover className="p-5">
                        <div className="flex items-start gap-4">
                          <span className="grid place-items-center w-11 h-11 rounded-xl bg-white/5 border border-command-border shrink-0">
                            <Activity className="w-5 h-5 text-electric-400" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display font-semibold text-white">{r.disaster_type}</h3>
                              <span className={`chip border ${SEVERITY_COLORS[r.severity]}`}>{r.severity}</span>
                              <span className={`chip border ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                              {r.verification_status && <VerificationStatusBadge status={r.verification_status} />}
                            </div>
                            <p className="text-sm text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                            {r.location_label && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                                <MapPin className="w-3.5 h-3.5" /> {r.location_label}
                              </div>
                            )}
                            {r.ai_severity !== null && (
                              <div className="mt-3">
                                <div className="flex items-center gap-1.5 text-xs text-electric-400 mb-1">
                                  <Brain className="w-3 h-3" /> AI Severity: {r.ai_severity}/100
                                  {r.ai_severity_label && <span className="text-slate-500">· {r.ai_severity_label}</span>}
                                </div>
                                <ProgressBar value={r.ai_severity} color="electric" />
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Nearby incidents */}
            <div>
              <SectionHeader title="Nearby incidents" subtitle="Active emergencies in your area." />
              <div className="grid sm:grid-cols-2 gap-3">
                {nearbyIncidents.map((r, i) => (
                  <motion.div key={r.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                    <GlassCard hover className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="live-dot live-dot-emergency" />
                        <span className={`chip border ${SEVERITY_COLORS[r.severity]} text-[10px] px-2 py-0.5`}>{r.severity}</span>
                      </div>
                      <h3 className="font-display font-semibold text-white text-sm">{r.disaster_type}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                      {r.location_label && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                          <MapPin className="w-3 h-3" /> {r.location_label.split('—')[0]}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: shelters, contacts, weather, AI recs */}
          <div className="space-y-6">
            {/* Nearest shelters */}
            <div>
              <SectionHeader title="Nearest shelters" />
              <div className="space-y-3">
                {SHELTERS.map((s, i) => (
                  <motion.div key={s.name} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}>
                    <GlassCard hover className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                          <Building2 className="w-5 h-5 text-emerald-400" />
                        </span>
                        <div className="flex-1">
                          <h3 className="font-display font-semibold text-white text-sm">{s.name}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {s.distance}</span>
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {s.capacity}</span>
                          </div>
                          <span className={`chip border mt-2 text-[10px] px-2 py-0.5 ${
                            s.status === 'Open' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                          }`}>{s.status}</span>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Emergency contacts */}
            <div>
              <SectionHeader title="Emergency contacts" />
              <div className="grid grid-cols-2 gap-3">
                {CONTACTS.map((c, i) => (
                  <motion.div key={c.label} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                    <GlassCard hover className="p-4 text-center">
                      <Phone className="w-5 h-5 text-emergency-400 mx-auto mb-2" />
                      <div className="font-mono font-bold text-xl text-white">{c.number}</div>
                      <div className="text-xs text-slate-400">{c.label}</div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Weather alerts */}
            <div>
              <SectionHeader title="Weather alerts" />
              <div className="space-y-3">
                {WEATHER_ALERTS.map((w, i) => (
                  <motion.div key={w.title} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}>
                    <GlassCard hover className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={`grid place-items-center w-10 h-10 rounded-xl border shrink-0 ${
                          w.tone === 'high' ? 'bg-emergency-500/10 border-emergency-500/30 text-emergency-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          <w.icon className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="font-display font-semibold text-white text-sm">{w.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{w.desc}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* AI recommendations */}
            <div>
              <SectionHeader title="AI recommendations" />
              <div className="space-y-3">
                {RECOMMENDATIONS.map((rec, i) => (
                  <motion.div key={rec.title} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}>
                    <GlassCard hover className="p-4">
                      <div className="flex items-start gap-3">
                        <span className={`grid place-items-center w-10 h-10 rounded-xl border shrink-0 ${
                          rec.tone === 'critical' ? 'bg-emergency-500/10 border-emergency-500/30 text-emergency-400'
                          : rec.tone === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          <rec.icon className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="font-display font-semibold text-white text-sm">{rec.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{rec.desc}</p>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Emergency + AI analysis */}
            <GlassCard className="p-6 relative overflow-hidden">
              <div className="absolute -top-10 right-0 w-40 h-40 bg-emergency-500/20 rounded-full blur-[60px]" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-emergency-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emergency-300">Emergency</span>
                </div>
                <h3 className="font-display font-bold text-white text-lg">In immediate danger?</h3>
                <p className="text-sm text-slate-400 mt-1">Broadcast your location and context to responders instantly.</p>
                <button onClick={() => navigate('sos')} className="btn-primary w-full mt-4 py-3.5">
                  <Siren className="w-4 h-4" /> Activate SOS
                </button>
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-3">
                  <TrendingUp className="w-3.5 h-3.5" /> 12,800 responders on standby
                </div>
              </div>
            </GlassCard>

            <GlassCard hover className="p-5 cursor-pointer">
              <button onClick={() => navigate('ai-analysis')} className="flex items-center gap-3 w-full">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-electric-500/10 border border-electric-500/30">
                  <Brain className="w-5 h-5 text-electric-400" />
                </span>
                <div className="flex-1 text-left">
                  <div className="font-display font-semibold text-white text-sm">Analyze an image</div>
                  <div className="text-xs text-slate-400">AI-powered damage assessment</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </button>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
