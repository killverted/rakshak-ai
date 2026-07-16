import { motion } from 'framer-motion';
import { Navbar, Footer } from '../components/Navbar';
import { GlassCard, SectionHeader } from '../components/ui';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { IndiaMap } from '../components/IndiaMap';
import { useRouter } from '../lib/router';
import {
  STATS, CATEGORIES, FEATURES, AI_CAPS, CONTACTS, TICKER_ITEMS,
  ShieldAlert, ArrowRight, Siren, Brain, Phone,
} from './landingData';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export function LandingPage() {
  const { navigate } = useRouter();

  return (
    <div className="relative">
      <Navbar />

      {/* Emergency ticker */}
      <div className="fixed top-16 inset-x-0 z-40 h-9 bg-emergency-950/80 backdrop-blur-md border-b border-emergency-500/20 overflow-hidden flex items-center">
        <div className="flex items-center gap-2 px-4 shrink-0 bg-emergency-500/15 border-r border-emergency-500/20 h-full">
          <span className="live-dot live-dot-emergency" />
          <span className="text-xs font-bold uppercase tracking-wider text-emergency-300">Live</span>
        </div>
        <div className="flex animate-ticker whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2 px-6 text-xs text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${
                item.severity === 'critical' ? 'bg-emergency-500'
                : item.severity === 'high' ? 'bg-orange-500'
                : item.severity === 'moderate' ? 'bg-amber-500'
                : 'bg-emerald-500'
              }`} />
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-emergency-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-electric-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* India map background */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[600px] opacity-30 pointer-events-none hidden lg:block">
          <IndiaMap className="w-full h-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 chip border border-emergency-500/30 bg-emergency-500/10 text-emergency-300 mb-6"
            >
              <span className="live-dot live-dot-emergency" />
              Live emergency operations
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-extrabold tracking-tight text-4xl sm:text-6xl lg:text-7xl text-balance"
            >
              <span className="gradient-text-red">Rakshak AI</span>
              <span className="block mt-2 text-white">AI Powered Disaster Management Platform</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl leading-relaxed text-balance"
            >
              Helping citizens, volunteers, and authorities respond faster during emergencies
              using Artificial Intelligence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              <button onClick={() => navigate('login')} className="btn-primary px-6 py-3.5 text-base">
                Access platform <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('sos')} className="btn-ghost px-6 py-3.5 text-base">
                <Siren className="w-4 h-4 text-emergency-400" /> Emergency SOS
              </button>
            </motion.div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <GlassCard hover className="p-5">
                  <div className="flex items-start justify-between">
                    <span className={`grid place-items-center w-11 h-11 rounded-xl border ${
                      s.accent === 'electric' ? 'text-electric-400 bg-electric-500/10 border-electric-500/30'
                      : s.accent === 'emergency' ? 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30'
                      : s.accent === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <s.icon className="w-5 h-5" />
                    </span>
                    <span className="text-xs text-emerald-400 font-medium">{s.trend}</span>
                  </div>
                  <div className="mt-4 text-3xl font-display font-bold text-white">
                    <AnimatedCounter value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <SectionHeader eyebrow="Disaster Categories" title="Covering every category of emergency"
            subtitle="Rakshak AI classifies, routes, and responds to a comprehensive spectrum of natural and man-made disasters." />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((c, i) => (
              <motion.div key={c.name} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <GlassCard hover className="p-5 group">
                  <span className="grid place-items-center w-12 h-12 rounded-xl bg-white/5 border border-command-border group-hover:border-emergency-500/40 group-hover:bg-emergency-500/10 transition-all">
                    <c.icon className="w-6 h-6 text-slate-300 group-hover:text-emergency-400 transition" />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-white">{c.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{c.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-command-border to-transparent" />
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <SectionHeader eyebrow="Platform Capabilities" title="An end-to-end response operating system"
            subtitle="From the first citizen report to verified resolution — every stage of the emergency lifecycle, unified." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <GlassCard hover className="p-6">
                  <span className="grid place-items-center w-12 h-12 rounded-xl bg-electric-500/10 border border-electric-500/30">
                    <f.icon className="w-6 h-6 text-electric-400" />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-white text-lg">{f.title}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Capabilities */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <SectionHeader eyebrow="Artificial Intelligence" title="AI that sees, scores, and routes"
                subtitle="Our models turn raw imagery and reports into actionable intelligence — faster than manual triage, at emergency scale." />
              <GlassCard className="p-6 mt-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-emergency-500/10 border border-emergency-500/30">
                    <Brain className="w-6 h-6 text-emergency-400" />
                  </span>
                  <div>
                    <div className="font-display font-semibold text-white">Rakshak Vision Engine</div>
                    <div className="text-xs text-slate-400">Gemini 2.0 Flash · multimodal inference</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  {[['Inference latency', '1.8s avg'], ['Image classes', '10+ disaster types'],
                    ['Severity accuracy', '94.2%'], ['Uptime', '99.98%']].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-mono font-semibold text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {AI_CAPS.map((c, i) => (
                <motion.div key={c.title} variants={fadeUp} initial="hidden" whileInView="show"
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                  <GlassCard hover className="p-6">
                    <span className="grid place-items-center w-11 h-11 rounded-xl bg-white/5 border border-command-border">
                      <c.icon className="w-5 h-5 text-electric-400" />
                    </span>
                    <h3 className="mt-4 font-display font-semibold text-white">{c.title}</h3>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{c.desc}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contacts */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <SectionHeader eyebrow="Emergency Contacts" title="Direct lines when seconds matter"
            subtitle="Critical helplines integrated into the Rakshak AI response network. Save these numbers — they save lives." />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CONTACTS.map((c, i) => (
              <motion.div key={c.label} variants={fadeUp} initial="hidden" whileInView="show"
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <GlassCard hover className="p-6">
                  <div className="flex items-center justify-between">
                    <Phone className="w-5 h-5 text-emergency-400" />
                    <span className="chip border border-emergency-500/30 bg-emergency-500/10 text-emergency-300">24/7</span>
                  </div>
                  <div className="mt-4 font-mono font-bold text-3xl text-white">{c.number}</div>
                  <div className="text-sm font-medium text-slate-200 mt-1">{c.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{c.desc}</div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <GlassCard className="relative overflow-hidden p-10 sm:p-14 text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emergency-500/15 rounded-full blur-[100px]" />
            <div className="relative">
              <ShieldAlert className="w-12 h-12 text-emergency-400 mx-auto mb-5" />
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white text-balance">
                Ready to build a more resilient region?
              </h2>
              <p className="text-slate-400 mt-4 max-w-xl mx-auto">
                Join the Rakshak AI network — report incidents, coordinate volunteers, and lead
                response with intelligence at every step.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => navigate('login')} className="btn-primary px-6 py-3.5 text-base">
                  Get started <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => navigate('admin')} className="btn-ghost px-6 py-3.5 text-base">
                  View admin dashboard
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </div>
  );
}
