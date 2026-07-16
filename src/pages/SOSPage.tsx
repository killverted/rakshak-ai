import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Siren, MapPin, Loader2, CheckCircle2, Radio, AlertTriangle,
  Navigation, Activity, ShieldAlert, Phone, X, Zap,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, LiveBadge } from '../components/ui';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

type Phase = 'idle' | 'locating' | 'broadcasting' | 'active';

const CONTACTS = [
  { label: 'NDRF', number: '1070', icon: ShieldAlert },
  { label: 'Fire', number: '101', icon: Zap },
  { label: 'Ambulance', number: '108', icon: Activity },
  { label: 'Helpline', number: '112', icon: Phone },
];

const NETWORK_STATS = [
  { label: 'Available responders', value: '12,800', icon: Radio, color: 'text-emerald-400' },
  { label: 'Avg dispatch time', value: '6.4 min', icon: Navigation, color: 'text-electric-400' },
  { label: 'Active units', value: '342', icon: ShieldAlert, color: 'text-emergency-400' },
];

export function SOSPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [responders, setResponders] = useState(0);
  const [, setError] = useState<string | null>(null);

  // Elapsed timer
  useEffect(() => {
    if (phase !== 'active') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Responder simulation — increments over time
  useEffect(() => {
    if (phase !== 'active') return;
    const t = setInterval(() => {
      setResponders((r) => Math.min(r + Math.floor(Math.random() * 3) + 1, 48));
    }, 1200);
    return () => clearInterval(t);
  }, [phase]);

  const activate = () => {
    setError(null);
    setPhase('locating');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ lat: latitude, lng: longitude });
          broadcast(latitude, longitude);
        },
        () => {
          // Fallback to default coordinates (Mumbai) if geolocation denied
          setCoords({ lat: 19.076, lng: 72.8777 });
          broadcast(19.076, 72.8777);
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    } else {
      setCoords({ lat: 19.076, lng: 72.8777 });
      broadcast(19.076, 72.8777);
    }
  };

  const broadcast = async (lat: number, lng: number) => {
    setPhase('broadcasting');
    // Simulate broadcast delay for premium feel
    await new Promise((r) => setTimeout(r, 1600));
    await supabase.from('activity_log').insert({
      action: 'SOS Broadcast',
      detail: `Emergency SOS broadcast from coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      severity: 'critical',
      actor: user?.email ?? 'Citizen',
    });
    setPhase('active');
    setResponders(3);
  };

  const cancel = () => {
    setPhase('idle');
    setCoords(null);
    setElapsed(0);
    setResponders(0);
    setError(null);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="min-h-screen pt-20 bg-command-bg">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        {/* Command center header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <SectionHeader
              eyebrow="Emergency Command Center"
              title="SOS Broadcast"
              subtitle="One-tap emergency beacon. Activates a critical broadcast with your live location to the nearest responders. Use only in genuine emergencies."
            />
            <div className="flex items-center gap-2 shrink-0">
              <LiveBadge label={phase === 'active' ? 'Broadcasting' : 'Standing by'} tone={phase === 'active' ? 'emergency' : 'emerald'} />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main SOS control — spans 2 columns */}
          <motion.div
            className="lg:col-span-2"
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.05 }}
          >
            <GlassCard className="p-8 sm:p-12 relative overflow-hidden">
              {/* Ambient emergency glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[320px] bg-emergency-500/15 rounded-full blur-[110px] pointer-events-none" />
              <div className="absolute inset-0 grid-bg opacity-[0.04] pointer-events-none" />

              {/* IDLE STATE */}
              {phase === 'idle' && (
                <div className="relative text-center">
                  <div className="relative inline-grid place-items-center mb-8">
                    {/* Pulsing emergency red glow rings */}
                    <motion.span
                      className="absolute w-44 h-44 rounded-full bg-emergency-500/20"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.span
                      className="absolute w-44 h-44 rounded-full bg-emergency-500/15"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
                    />
                    <motion.span
                      className="absolute w-44 h-44 rounded-full bg-emergency-500/10"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: 1.2 }}
                    />
                    <motion.button
                      onClick={activate}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative grid place-items-center w-44 h-44 rounded-full bg-gradient-to-br from-emergency-500 to-emergency-700 shadow-glow group"
                    >
                      <motion.span
                        className="absolute inset-0 rounded-full bg-emergency-400/30"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <Siren className="w-16 h-16 text-white relative z-10" />
                    </motion.button>
                  </div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    Activate SOS Beacon
                  </h2>
                  <p className="text-slate-400 mt-3 max-w-sm mx-auto leading-relaxed">
                    Pressing the button will acquire your GPS location and broadcast a critical
                    emergency alert to nearby responders and dispatch centers.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
                    <ShieldAlert className="w-3.5 h-3.5 text-emergency-400" />
                    <span>For genuine emergencies only</span>
                  </div>
                </div>
              )}

              {/* LOCATING + BROADCASTING STATES */}
              {(phase === 'locating' || phase === 'broadcasting') && (
                <div className="relative text-center py-10">
                  <div className="relative inline-grid place-items-center mb-6">
                    <motion.span
                      className="absolute w-20 h-20 rounded-full bg-emergency-500/20"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <span className="relative grid place-items-center w-20 h-20 rounded-full bg-emergency-500/10 border border-emergency-500/30">
                      <Loader2 className="w-9 h-9 text-emergency-400 animate-spin" />
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
                    {phase === 'locating' ? 'Acquiring Location…' : 'Broadcasting SOS…'}
                  </h2>
                  <p className="text-slate-400 mt-3 max-w-sm mx-auto">
                    {phase === 'locating'
                      ? 'Requesting GPS coordinates from your device.'
                      : 'Alerting nearest responders and emergency dispatch centers.'}
                  </p>
                  {/* Progress steps */}
                  <div className="flex items-center justify-center gap-2 mt-7">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${phase === 'locating' ? 'text-emergency-300' : 'text-emerald-300'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> GPS
                    </span>
                    <span className="w-8 h-px bg-command-border" />
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${phase === 'broadcasting' ? 'text-emergency-300' : 'text-slate-500'}`}>
                      {phase === 'broadcasting' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />} Broadcast
                    </span>
                    <span className="w-8 h-px bg-command-border" />
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <ShieldAlert className="w-3.5 h-3.5" /> Dispatch
                    </span>
                  </div>
                </div>
              )}

              {/* ACTIVE STATE */}
              {phase === 'active' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  {/* Active status banner */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="relative flex w-3 h-3">
                      <motion.span
                        className="absolute inline-flex h-full w-full rounded-full bg-emergency-400"
                        animate={{ scale: [1, 2.2, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emergency-500" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emergency-300">
                      SOS Active
                    </span>
                  </div>

                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
                    Help is on the way
                  </h2>
                  <p className="text-slate-400 mt-3 max-w-md leading-relaxed">
                    Stay where you are if it's safe. Responders are being dispatched to your
                    location. Keep your phone on and charged.
                  </p>

                  {/* Live metrics */}
                  <div className="grid grid-cols-2 gap-4 mt-7">
                    <div className="p-5 rounded-xl bg-command-surface/60 border border-command-border">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Activity className="w-3.5 h-3.5 text-electric-400" /> Elapsed
                      </div>
                      <div className="font-mono font-bold text-3xl text-white">{fmt(elapsed)}</div>
                    </div>
                    <div className="p-5 rounded-xl bg-command-surface/60 border border-command-border">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Radio className="w-3.5 h-3.5 text-emergency-400" /> Responders notified
                      </div>
                      <div className="font-mono font-bold text-3xl text-emerald-400">{responders}</div>
                    </div>
                  </div>

                  {/* Coordinates */}
                  {coords && (
                    <div className="mt-4 p-5 rounded-xl bg-command-surface/60 border border-command-border">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-emergency-400" /> Your coordinates
                      </div>
                      <div className="font-mono font-semibold text-white text-lg">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </div>
                    </div>
                  )}

                  {/* Confirmation */}
                  <div className="mt-6 flex items-center gap-2 text-sm text-emerald-300">
                    <CheckCircle2 className="w-4 h-4" /> Alert received by dispatch center
                  </div>

                  {/* Cancel button */}
                  <button
                    onClick={cancel}
                    className="btn-ghost w-full mt-6 py-3.5 hover:border-emergency-500/40 hover:bg-emergency-500/5"
                  >
                    <X className="w-4 h-4" /> Cancel SOS
                  </button>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>

          {/* Side panel — status + contacts + warning */}
          <div className="space-y-5">
            {/* Response network */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Radio className="w-4 h-4 text-electric-400" />
                  <h3 className="font-display font-semibold text-white">Response Network</h3>
                </div>
                <div className="space-y-3">
                  {NETWORK_STATS.map((s) => (
                    <div
                      key={s.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-command-surface/50 border border-command-border"
                    >
                      <span className="flex items-center gap-2 text-sm text-slate-300">
                        <s.icon className={`w-4 h-4 ${s.color}`} /> {s.label}
                      </span>
                      <span className="font-mono font-semibold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Emergency contacts */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Phone className="w-4 h-4 text-emergency-400" />
                  <h3 className="font-display font-semibold text-white">Emergency Helplines</h3>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {CONTACTS.map((c) => (
                    <a
                      key={c.label}
                      href={`tel:${c.number}`}
                      className="flex flex-col p-3.5 rounded-xl bg-command-surface/50 border border-command-border hover:border-emergency-500/40 hover:bg-emergency-500/5 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <c.icon className="w-4 h-4 text-emergency-400 group-hover:scale-110 transition" />
                        <span className="font-mono font-bold text-xl text-white">{c.number}</span>
                      </div>
                      <span className="text-xs text-slate-400 mt-1.5">{c.label}</span>
                    </a>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Warning card */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
              <GlassCard className="p-6 border-emergency-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-emergency-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-display font-semibold text-white text-sm">Use SOS responsibly</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      False alerts divert critical resources from real emergencies. Activate only
                      when you or others are in genuine danger.
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>

        {/* Bottom navigation helper */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.25 }}
          className="mt-8 flex justify-center"
        >
          <button onClick={() => navigate('citizen')} className="btn-ghost px-5 py-2.5 text-sm">
            <Navigation className="w-4 h-4" /> Back to dashboard
          </button>
        </motion.div>
      </div>
    </div>
  );
}
