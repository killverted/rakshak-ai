import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, MapPin, ImagePlus, X, Loader2, CheckCircle2, AlertCircle,
  Navigation, Send, Brain, Copy, CloudRain,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader } from '../components/ui';
import { useRouter } from '../lib/router';
import { useAuth } from '../lib/auth';
import { supabase, DISASTER_TYPES } from '../lib/supabase';
import { detectDuplicates } from '../lib/verification';
import { fetchWeather, type WeatherData } from '../lib/weather';
import { fetchNearbyServices } from '../lib/nearby';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low', tone: 'emerald' },
  { value: 'moderate', label: 'Moderate', tone: 'amber' },
  { value: 'high', label: 'High', tone: 'orange' },
  { value: 'critical', label: 'Critical', tone: 'emergency' },
] as const;

const SEVERITY_TONE: Record<string, string> = {
  emerald: 'border-emerald-500/40 bg-emergency-500/5 text-emerald-300',
  amber: 'border-amber-500/40 bg-amber-500/5 text-amber-300',
  orange: 'border-orange-500/40 bg-orange-500/5 text-orange-300',
  emergency: 'border-emergency-500/40 bg-emergency-500/10 text-emergency-300',
};

export function ReportPage() {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [disasterType, setDisasterType] = useState<string>('Flood');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('moderate');
  const [image, setImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<{
    type: string; location: string; hasImage: boolean; isDuplicate: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError('Image is too large. Please upload an image under 10MB.');
      return;
    }
    setError(null);
    setImageName(f.name);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const clearImage = () => {
    setImage(null);
    setImageName('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const locate = () => {
    setLocating(true);
    setError(null);
    if (!navigator.geolocation) {
      setLocating(false);
      setError('Geolocation is not supported by this browser. Coordinates left blank.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        setLocating(false);
        // Fetch weather + check for duplicates
        const [w, dup] = await Promise.all([
          fetchWeather(c.lat, c.lng),
          detectDuplicates(c.lat, c.lng, disasterType),
        ]);
        setWeather(w);
        if (dup.isDuplicate) {
          setDuplicateWarning(`Possible duplicate detected — ${dup.nearbyCount} similar ${disasterType} report${dup.nearbyCount > 1 ? 's' : ''} within 1 km in the last 30 minutes.`);
        }
      },
      (err) => {
        setLocating(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access or file the report without coordinates.'
            : 'Unable to detect location. You can still submit the report without coordinates.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the disaster.');
      return;
    }
    setError(null);
    setSubmitting(true);

    const actor = user?.email?.split('@')[0] ?? 'Citizen';
    const locationLabel = coords
      ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
      : 'Location not provided';

    try {
      // 1. Check for duplicates if coordinates available
      let dupResult = { isDuplicate: false, duplicateOf: null as string | null, nearbyCount: 0 };
      if (coords) {
        dupResult = await detectDuplicates(coords.lat, coords.lng, disasterType);
      }

      // 2. Fetch nearby services if coordinates available
      let nearby = null;
      if (coords) {
        nearby = await fetchNearbyServices(coords.lat, coords.lng);
      }

      // 3. Insert into reports with all new fields
      const insertData: Record<string, unknown> = {
        user_id: user?.id ?? null,
        disaster_type: disasterType,
        description: description.trim(),
        severity,
        status: 'pending',
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        location_label: locationLabel,
        image_url: image,
        ai_severity: null,
        ai_summary: 'Pending AI analysis — report queued for triage.',
        verification_status: 'pending',
        is_duplicate: dupResult.isDuplicate,
        duplicate_of: dupResult.duplicateOf,
        reported_by: actor,
        nearby_services: nearby && nearby.length > 0 ? nearby : null,
      };

      if (weather) {
        insertData.weather_temp = weather.temp;
        insertData.weather_humidity = weather.humidity;
        insertData.weather_wind_speed = weather.wind_speed;
        insertData.weather_rainfall = weather.rainfall;
        insertData.weather_visibility = weather.visibility;
        insertData.weather_alert = weather.alert;
        insertData.weather_summary = weather.summary;
      }

      const { error: reportError } = await supabase
        .from('reports')
        .insert(insertData)
        .select('id')
        .single();

      if (reportError) {
        throw new Error(`Report failed: ${reportError.message}`);
      }

      // 4. Insert into activity_log
      const { error: logError } = await supabase.from('activity_log').insert({
        action: 'Report submitted',
        detail: `${disasterType} report filed${
          coords ? ` at ${locationLabel}` : ' (no coordinates)'
        }${description.trim() ? ` — ${description.trim().slice(0, 80)}` : ''}${dupResult.isDuplicate ? ' [DUPLICATE]' : ''}`,
        severity,
        actor,
      });

      if (logError) {
        console.warn('activity_log insert failed:', logError.message);
      }

      setSubmittedReport({
        type: disasterType,
        location: locationLabel,
        hasImage: !!image,
        isDuplicate: dupResult.isDuplicate,
      });
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error during submission.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDisasterType('Flood');
    setDescription('');
    setSeverity('moderate');
    clearImage();
    setCoords(null);
    setSubmittedReport(null);
    setDone(false);
    setError(null);
    setDuplicateWarning(null);
    setWeather(null);
  };

  /* ---------- Success state ---------- */
  if (done && submittedReport) {
    return (
      <div className="min-h-screen pt-20 bg-command-bg">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-16">
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <GlassCard className="p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="absolute -top-20 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-16 w-56 h-56 bg-electric-500/10 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 16 }}
                  className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-5 shadow-glow-emerald"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </motion.span>
                <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
                  Report received
                </h1>
                <p className="text-slate-400 mt-2.5 max-w-md mx-auto leading-relaxed">
                  Your <span className="text-emergency-300 font-semibold">{submittedReport.type}</span> report
                  {submittedReport.location !== 'Location not provided'
                    ? <> near <span className="text-electric-300 font-mono text-sm">{submittedReport.location}</span></>
                    : null}
                  {' '}has been logged in the command center and queued for AI triage. Responders have been notified.
                </p>

                {submittedReport.isDuplicate && (
                  <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-center gap-2">
                    <Copy className="w-4 h-4 shrink-0" />
                    Possible duplicate detected — verification confidence increased.
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mt-7">
                  <div className="p-3 rounded-xl bg-command-surface/60 border border-command-border">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Type</div>
                    <div className="text-sm font-semibold text-white mt-1 truncate">{submittedReport.type}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-command-surface/60 border border-command-border">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Severity</div>
                    <div className="text-sm font-semibold text-white mt-1 capitalize">{severity}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-command-surface/60 border border-command-border">
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Image</div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {submittedReport.hasImage ? 'Attached' : 'None'}
                    </div>
                  </div>
                </div>

                {submittedReport.hasImage && (
                  <div className="mt-6 p-4 rounded-xl bg-electric-500/5 border border-electric-500/20 text-left">
                    <div className="flex items-start gap-3">
                      <span className="grid place-items-center w-9 h-9 rounded-lg bg-electric-500/10 border border-electric-500/30 shrink-0">
                        <Brain className="w-4.5 h-4.5 text-electric-400" />
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">Run AI image analysis</div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Send the attached imagery through the Gemini vision engine to detect damage patterns, score severity, and surface safety recommendations.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('ai-analysis')}
                      className="btn-accent w-full mt-4 py-3"
                    >
                      <Brain className="w-4 h-4" />
                      Analyze image with AI
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <button onClick={() => navigate('citizen')} className="btn-ghost px-5 py-3">
                    Back to dashboard
                  </button>
                  <button onClick={resetForm} className="btn-ghost px-5 py-3">
                    File another report
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ---------- Form state ---------- */
  return (
    <div className="min-h-screen pt-20 bg-command-bg">
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <SectionHeader
            eyebrow="Command Center · Report"
            title="File a disaster report"
            subtitle="Provide details, imagery, and location so the command center can triage and route responders effectively. Every report feeds the live operations map."
          />
        </motion.div>

        <form onSubmit={submit} className="grid lg:grid-cols-5 gap-6">
          {/* ---------- Left column: image + geolocation ---------- */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image upload */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
              <GlassCard className="p-6">
                <label className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <ImagePlus className="w-4 h-4 text-electric-400" /> Imagery
                  <span className="ml-auto text-xs font-normal text-slate-500">Optional</span>
                </label>
                {image ? (
                  <div className="relative rounded-xl overflow-hidden border border-command-border group">
                    <img src={image} alt="disaster preview" className="w-full h-56 object-cover" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-3 right-3 grid place-items-center w-9 h-9 rounded-lg bg-command-bg/80 border border-command-border hover:bg-emergency-500/20 hover:border-emergency-500/40 transition"
                      aria-label="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-command-bg via-command-bg/70 to-transparent">
                      <p className="text-xs text-slate-300 truncate font-mono">{imageName}</p>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-56 rounded-xl border-2 border-dashed border-command-border hover:border-electric-400/50 hover:bg-electric-500/5 cursor-pointer transition group">
                    <ImagePlus className="w-9 h-9 text-slate-500 group-hover:text-electric-400 transition" />
                    <p className="text-sm text-slate-400 mt-3">Click to upload or drag &amp; drop</p>
                    <p className="text-xs text-slate-600 mt-1">PNG, JPG up to 10MB</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                  </label>
                )}
              </GlassCard>
            </motion.div>

            {/* Geolocation */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
              <GlassCard className="p-6">
                <label className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <MapPin className="w-4 h-4 text-electric-400" /> Geolocation
                </label>
                <button
                  type="button"
                  onClick={locate}
                  disabled={locating}
                  className="btn-ghost w-full py-3 text-sm"
                >
                  {locating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  {locating ? 'Detecting location…' : 'Capture my coordinates'}
                </button>
                {coords && !locating && (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 animate-fade-in">
                    <div className="flex items-center gap-2 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Location acquired
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="font-mono text-slate-300">
                        <span className="text-slate-500">Lat</span> {coords.lat.toFixed(4)}
                      </div>
                      <div className="font-mono text-slate-300">
                        <span className="text-slate-500">Lng</span> {coords.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}
                {!coords && !locating && (
                  <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                    Coordinates are attached to the report for responder routing. You may submit without location if unavailable.
                  </p>
                )}

                {/* Weather preview */}
                {weather && (
                  <div className="mt-3 p-3 rounded-xl bg-electric-500/5 border border-electric-500/20">
                    <div className="flex items-center gap-1.5 text-xs text-electric-300 mb-2">
                      <CloudRain className="w-3.5 h-3.5" /> Weather at location
                    </div>
                    <p className="text-xs text-slate-400">{weather.summary}</p>
                    {weather.alert && (
                      <div className="mt-1.5 text-[11px] text-amber-400 bg-amber-500/10 rounded px-2 py-0.5 inline-block">
                        {weather.alert}
                      </div>
                    )}
                  </div>
                )}

                {/* Duplicate warning */}
                {duplicateWarning && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-fade-in">
                    <div className="flex items-start gap-2 text-xs text-amber-300">
                      <Copy className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{duplicateWarning}</span>
                    </div>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>

          {/* ---------- Right column: type + severity + description + submit ---------- */}
          <div className="lg:col-span-3 space-y-6">
            {/* Disaster type */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
              <GlassCard className="p-6">
                <label className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-electric-400" /> Disaster type
                </label>
                <div className="relative">
                  <select
                    value={disasterType}
                    onChange={(e) => setDisasterType(e.target.value)}
                    className="glass-input appearance-none pr-10"
                  >
                    {DISASTER_TYPES.map((t) => (
                      <option key={t} value={t} className="bg-command-surface text-white">
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▾</span>
                </div>
              </GlassCard>
            </motion.div>

            {/* Severity */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
              <GlassCard className="p-6">
                <label className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-emergency-400" /> Severity assessment
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {SEVERITY_OPTIONS.map((opt) => {
                    const active = severity === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSeverity(opt.value)}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          active
                            ? SEVERITY_TONE[opt.tone] + ' shadow-glow scale-[1.02]'
                            : 'border-command-border bg-command-surface/40 text-slate-400 hover:border-command-border hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
              <GlassCard className="p-6">
                <label className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-electric-400" /> Description
                  <span className="ml-auto text-xs font-normal text-slate-500">{description.length} chars</span>
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Describe what you observe — extent of damage, people affected, immediate hazards, access routes, weather conditions…"
                  className="glass-input resize-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Be as specific as possible. This text is forwarded to the on-duty triage officer.
                </p>
              </GlassCard>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 text-sm text-emergency-300 bg-emergency-500/10 border border-emergency-500/30 rounded-xl p-4"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-emergency-400" />
                <div>
                  <div className="font-semibold text-emergency-200">Submission issue</div>
                  <span className="text-emergency-300/90 leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}

            {/* Submit */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="btn-primary w-full py-4 text-base relative overflow-hidden"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Transmitting to command center…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit report
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-500 mt-3">
                Reports are logged to the operations feed and routed for AI triage.
              </p>
            </motion.div>
          </div>
        </form>
      </div>
    </div>
  );
}
