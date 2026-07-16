import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, ImagePlus, X, Loader2, Scan, AlertTriangle, ShieldCheck,
  Lightbulb, Activity, Cpu, Eye, CheckCircle2, ArrowRight, Zap,
  AlertCircle, Flame, Cloud, Waves, Wind, Mountain, Factory, Building2,
  Droplets, Save, Crosshair, Gauge, Target, FileText, Fingerprint,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, SeverityMeter, ProgressBar } from '../components/ui';
import { VerificationCard } from '../components/VerificationCard';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { supabase, type AIAnalysisResult } from '../lib/supabase';
import { runVerificationPipeline, getOrCreateProfile, type VerificationResult } from '../lib/verification';

const STAGES = [
  'Preprocessing image', 'Running Gemini vision model', 'Detecting damage patterns',
  'Scoring severity', 'Generating recommendations',
];

const TYPE_ICONS: Record<string, typeof Cloud> = {
  Flood: Cloud, Fire: Flame, Earthquake: Waves, Cyclone: Wind, Landslide: Mountain,
  'Industrial Accident': Factory, 'Building Collapse': Building2,
  'Chemical Spill': Factory, 'Water Crisis': Droplets, Other: AlertCircle,
};

const PRIORITY_STYLES: Record<string, { color: string; label: string }> = {
  P1: { color: 'border-emergency-500/40 bg-emergency-500/10 text-emergency-300', label: 'Critical — Immediate' },
  P2: { color: 'border-orange-500/40 bg-orange-500/10 text-orange-300', label: 'High — Urgent' },
  P3: { color: 'border-amber-500/40 bg-amber-500/10 text-amber-300', label: 'Medium — Monitor' },
  P4: { color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300', label: 'Low — Routine' },
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'border-emergency-500/40 bg-emergency-500/10 text-emergency-300',
  High: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  Medium: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  Low: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
};

function stripDataUrl(dataUrl: string): { data: string; mime: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  return match ? { data: match[2], mime: match[1] } : { data: dataUrl, mime: 'image/jpeg' };
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function AIAnalysisPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [inFlight, setInFlight] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [reporterScore, setReporterScore] = useState(50);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('Image is too large. Please upload an image under 10MB.'); return; }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setResult(null); setSaved(false); setVerification(null); };
    reader.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!image || inFlight || analyzing) return;
    setInFlight(true);
    setAnalyzing(true);
    setResult(null);
    setError(null);
    setSaved(false);
    setVerification(null);

    const stageTimer = setInterval(() => setStage((s) => (s < STAGES.length - 1 ? s + 1 : s)), 900);
    setStage(0);

    try {
      const { data, mime } = stripDataUrl(image);
      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ image: data, mimeType: mime }),
      });

      clearInterval(stageTimer);
      setStage(STAGES.length - 1);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `AI service returned ${res.status}`);
      }

      const payload = await res.json();
      if (!payload.analysis) throw new Error('AI service returned an unexpected response.');
      setResult(payload.analysis as AIAnalysisResult);
    } catch (err) {
      clearInterval(stageTimer);
      const msg = err instanceof Error ? err.message : 'Failed to reach AI service.';
      setError(msg.includes('not configured')
        ? 'AI service is not configured. Please add a GEMINI_API_KEY secret to enable analysis.'
        : `AI analysis unavailable: ${msg}`);
    } finally {
      setAnalyzing(false);
      setInFlight(false);
    }
  };

  const saveToReport = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const { data: inserted, error: insertError } = await supabase.from('reports').insert({
        user_id: user?.id ?? null,
        disaster_type: result.disaster_type,
        description: result.summary,
        severity:
          result.severity_label === 'Critical' ? 'critical'
          : result.severity_label === 'High' ? 'high'
          : result.severity_label === 'Medium' ? 'moderate' : 'low',
        status: 'triaged',
        image_url: image,
        ai_severity: result.severity_score,
        ai_summary: result.summary,
        ai_severity_label: result.severity_label,
        ai_confidence: result.confidence,
        ai_hazards: result.hazards,
        ai_safety_actions: result.safety_actions,
        ai_priority_level: result.priority_level,
        ai_estimated_affected_area: result.estimated_affected_area,
        ai_analyzed_at: new Date().toISOString(),
        image_authenticity: result.image_authenticity,
        verification_status: 'pending',
        reported_by: user?.email?.split('@')[0] ?? 'Citizen',
      }).select('id').single();

      if (insertError) throw insertError;

      // Run verification pipeline
      if (inserted?.id) {
        const score = user?.id ? await getOrCreateProfile(user.id) : 50;
        setReporterScore(score);
        const vResult = await runVerificationPipeline(
          inserted.id,
          { lat: null, lng: null, disaster_type: result.disaster_type, user_id: user?.id ?? null },
          result
        );
        setVerification(vResult);
      }

      setSaved(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to save analysis: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setImage(null); setResult(null); setError(null); setSaved(false); setStage(0); setVerification(null); };

  return (
    <div className="min-h-screen pt-20">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        <SectionHeader eyebrow="AI Image Analysis" title="Upload imagery for AI damage assessment"
          subtitle="Gemini-powered vision analysis detects disaster type, estimates severity, and surfaces safety recommendations from a single image." />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: upload + preview */}
          <div className="space-y-5">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-electric-400" /> Disaster imagery
                </label>
                {image && (
                  <button onClick={reset} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
              {image ? (
                <div className="relative rounded-xl overflow-hidden border border-command-border">
                  <img src={image} alt="disaster" className="w-full h-80 object-cover" />
                  {analyzing && (
                    <div className="absolute inset-0 bg-command-bg/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <Scan className="w-12 h-12 text-electric-400 animate-pulse" />
                        <div className="absolute inset-0 border-2 border-electric-400/40 rounded-full animate-pulse-ring" />
                      </div>
                      <p className="text-sm text-white font-medium">{STAGES[stage]}…</p>
                    </div>
                  )}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-80 rounded-xl border-2 border-dashed border-command-border hover:border-electric-400/50 hover:bg-electric-500/5 cursor-pointer transition group">
                  <ImagePlus className="w-10 h-10 text-slate-500 group-hover:text-electric-400 transition" />
                  <p className="text-sm text-slate-400 mt-3">Upload a disaster image to analyze</p>
                  <p className="text-xs text-slate-600 mt-1">JPG, PNG up to 10MB</p>
                  <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                </label>
              )}
              <button onClick={analyze} disabled={!image || analyzing || inFlight}
                className="btn-accent w-full mt-4 py-3.5">
                {analyzing || inFlight ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                {analyzing || inFlight ? 'Analyzing…' : 'Run AI analysis'}
              </button>
            </GlassCard>

            {/* AI engine card */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-emergency-500/10 border border-emergency-500/30">
                  <Cpu className="w-6 h-6 text-emergency-400" />
                </span>
                <div>
                  <div className="font-display font-semibold text-white">Gemini Vision Engine</div>
                  <div className="text-xs text-slate-400">gemini-3.5-flash · multimodal · weather-aware</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Eye, label: 'Image classes', value: '10+' },
                  { icon: Zap, label: 'Latency', value: '~2s' },
                  { icon: Activity, label: 'Confidence scored', value: 'Yes' },
                  { icon: ShieldCheck, label: 'Edge secured', value: 'Yes' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-command-surface/60 border border-command-border">
                    <m.icon className="w-4 h-4 text-electric-400" />
                    <div>
                      <div className="text-xs text-slate-500">{m.label}</div>
                      <div className="font-mono font-semibold text-white text-sm">{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right: results */}
          <div className="space-y-5">
            {!result && !analyzing && !error && (
              <GlassCard className="p-10 text-center">
                <Brain className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-white">No analysis yet</h3>
                <p className="text-sm text-slate-400 mt-1.5 max-w-sm mx-auto">
                  Upload an image and run the AI analysis to see detected disaster type, severity, hazards, and safety recommendations.
                </p>
              </GlassCard>
            )}

            {error && (
              <GlassCard className="p-6 animate-fade-in border-emergency-500/30">
                <div className="flex items-start gap-3">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-emergency-500/10 border border-emergency-500/30 shrink-0">
                    <AlertCircle className="w-5 h-5 text-emergency-400" />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-white">AI service unavailable</h3>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{error}</p>
                    <button onClick={analyze} className="btn-ghost mt-4 py-2.5 text-sm">
                      <Loader2 className="w-4 h-4" /> Retry analysis
                    </button>
                  </div>
                </div>
              </GlassCard>
            )}

            {analyzing && (
              <GlassCard className="p-6">
                <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-electric-400" /> Analysis in progress
                </h3>
                <div className="space-y-3">
                  {STAGES.map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                      <span className={`grid place-items-center w-6 h-6 rounded-full border text-xs ${
                        i < stage ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : i === stage ? 'bg-electric-500/10 border-electric-500/30 text-electric-400'
                        : 'bg-white/5 border-command-border text-slate-600'
                      }`}>
                        {i < stage ? <CheckCircle2 className="w-4 h-4" /> : i === stage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : i + 1}
                      </span>
                      <span className={`text-sm ${i <= stage ? 'text-white' : 'text-slate-500'}`}>{s}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {result && (
              <>
                {/* Main analysis report */}
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <GlassCard className="p-6 relative overflow-hidden">
                    <div className="absolute -top-16 -right-10 w-48 h-48 bg-emergency-500/10 rounded-full blur-[70px] pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-emergency-400" />
                          <h3 className="font-display font-semibold text-white text-lg">AI Analysis Report</h3>
                        </div>
                        <span className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Analyzed
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        {(() => {
                          const Icon = TYPE_ICONS[result.disaster_type] ?? AlertCircle;
                          return (
                            <span className="grid place-items-center w-12 h-12 rounded-xl bg-white/5 border border-command-border">
                              <Icon className="w-6 h-6 text-electric-400" />
                            </span>
                          );
                        })()}
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider">Detected disaster type</div>
                          <div className="font-display font-bold text-white text-xl">{result.disaster_type}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-command-surface/60 border border-command-border">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                            <Gauge className="w-3.5 h-3.5" /> Threat Level
                          </div>
                          <span className={`chip border ${SEVERITY_STYLES[result.severity_label] || SEVERITY_STYLES.Medium}`}>
                            {result.severity_label}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-command-surface/60 border border-command-border">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                            <Target className="w-3.5 h-3.5" /> Priority
                          </div>
                          <span className={`chip border ${PRIORITY_STYLES[result.priority_level]?.color || PRIORITY_STYLES.P3.color}`}>
                            {result.priority_level}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                          <FileText className="w-3.5 h-3.5" /> AI Executive Summary
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed bg-command-surface/40 border border-command-border rounded-xl p-4">
                          {result.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Activity className="w-3.5 h-3.5" /> Confidence
                            </span>
                            <span className="font-mono font-semibold text-white">{result.confidence}%</span>
                          </div>
                          <ProgressBar value={result.confidence} color="electric" />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1.5">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <Fingerprint className="w-3.5 h-3.5" /> Authenticity
                            </span>
                            <span className="font-mono font-semibold text-white">{result.image_authenticity ?? 50}%</span>
                          </div>
                          <ProgressBar value={result.image_authenticity ?? 50} color="emerald" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Severity meter */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
                  <GlassCard className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Gauge className="w-5 h-5 text-emergency-400" />
                      <h3 className="font-display font-semibold text-white text-lg">Severity Assessment</h3>
                    </div>
                    <SeverityMeter value={result.severity_score} />
                  </GlassCard>
                </motion.div>

                {/* Estimated affected area */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                  <GlassCard className="p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid place-items-center w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <Crosshair className="w-5 h-5 text-amber-400" />
                      </span>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider">Estimated Affected Area</div>
                        <div className="font-display font-bold text-white text-lg">{result.estimated_affected_area}</div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Hazards */}
                {result.hazards.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
                    <GlassCard className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-orange-400" />
                        <h3 className="font-display font-semibold text-white text-lg">Detected Hazards</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.hazards.map((h, i) => (
                          <span key={i} className="chip border border-orange-500/30 bg-orange-500/10 text-orange-300">
                            <AlertCircle className="w-3.5 h-3.5" /> {h}
                          </span>
                        ))}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {/* Safety actions */}
                {result.safety_actions.length > 0 && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
                    <GlassCard className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                        <h3 className="font-display font-semibold text-white text-lg">Immediate Safety Actions</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {result.safety_actions.map((s, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="grid place-items-center w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </GlassCard>
                  </motion.div>
                )}

                {/* Verification card (after save) */}
                {verification && (
                  <VerificationCard
                    trustScore={verification.trust_score}
                    status={verification.status}
                    aiConfidence={result.confidence}
                    imageAuthenticity={result.image_authenticity ?? 50}
                    reporterScore={reporterScore}
                    nearbyCount={verification.nearby_count}
                    isDuplicate={verification.is_duplicate}
                  />
                )}

                {/* Save + report */}
                {saved ? (
                  <GlassCard className="p-5 animate-scale-in border-emerald-500/30">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="text-sm text-white font-medium">Analysis saved and verification pipeline completed.</span>
                    </div>
                  </GlassCard>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={saveToReport} disabled={saving} className="btn-primary flex-1 py-3.5">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? 'Saving & verifying…' : 'Save & verify'}
                    </button>
                    <button onClick={() => navigate('report')} className="btn-ghost flex-1 py-3.5">
                      File a new report <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
