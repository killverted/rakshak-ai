import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, X, Radio, ShieldCheck, Building2,
  AlertTriangle, Activity, Layers, Eye, Zap, Navigation,
  Cross, Shield, Flame, Home, Phone, Clock, User,
  CloudRain, Wind, Thermometer, Droplets,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, LiveBadge, Spinner } from '../components/ui';
import { LiveMap } from '../components/LiveMap';
import { VerificationStatusBadge, TrustScoreBadge } from '../components/VerificationCard';
import { supabase, type Report, type NearbyService, SEVERITY_COLORS } from '../lib/supabase';
import { fetchNearbyServices } from '../lib/nearby';
import { fetchWeather, type WeatherData } from '../lib/weather';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export function DisasterMapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Report | null>(null);
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      setReports((data as Report[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter((r) => r.disaster_type === filter);
  }, [reports, filter]);

  const types = useMemo(() => [...new Set(reports.map((r) => r.disaster_type))], [reports]);

  const selectReport = useCallback(async (r: Report) => {
    setSelected(r);
    if (r.lat !== null && r.lng !== null) {
      setServicesLoading(true);
      const [services, w] = await Promise.all([
        r.nearby_services && Array.isArray(r.nearby_services) && r.nearby_services.length > 0
          ? Promise.resolve(r.nearby_services as NearbyService[])
          : fetchNearbyServices(r.lat!, r.lng!),
        r.weather_summary
          ? Promise.resolve({
              temp: r.weather_temp ?? 0, humidity: r.weather_humidity ?? 0,
              wind_speed: r.weather_wind_speed ?? 0, rainfall: r.weather_rainfall ?? 0,
              visibility: r.weather_visibility ?? 10000, alert: r.weather_alert,
              summary: r.weather_summary,
            } as WeatherData)
          : fetchWeather(r.lat!, r.lng!),
      ]);
      setNearbyServices(services);
      setWeather(w);
      setServicesLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen pt-20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="section-label mb-2">Live Operations</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Disaster Map</h1>
            <p className="text-slate-400 mt-1.5">Real-time incident monitoring across India with live OpenStreetMap.</p>
          </div>
          <LiveBadge label="Live feed" tone="emergency" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <GlassCard className="p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-command-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emergency-400" />
                  <h3 className="font-display font-semibold text-white">Live India Map</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {filtered.filter(r => r.lat).length} incidents</span>
                </div>
              </div>
              <div className="h-[500px] relative">
                {loading ? <Spinner label="Loading map..." /> : (
                  <LiveMap reports={filtered} nearbyServices={nearbyServices} showServices={!!selected} zoom={5} />
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right: filters + detail */}
          <div className="space-y-6">
            {/* Filters */}
            <div>
              <SectionHeader title="Filters" />
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setFilter('all')}
                  className={`chip border px-3 py-1.5 text-xs ${filter === 'all' ? 'border-electric-500/40 bg-electric-500/10 text-electric-300' : 'border-command-border bg-white/5 text-slate-400'}`}>
                  All
                </button>
                {types.map((t) => (
                  <button key={t} onClick={() => setFilter(t)}
                    className={`chip border px-3 py-1.5 text-xs ${filter === t ? 'border-emergency-500/40 bg-emergency-500/10 text-emergency-300' : 'border-command-border bg-white/5 text-slate-400'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            {selected ? (
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <GlassCard className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-semibold text-white">Incident Detail</h3>
                    <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {selected.image_url && (
                    <img src={selected.image_url} alt="disaster" className="w-full h-36 object-cover rounded-lg border border-command-border mb-3" />
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-emergency-400" />
                    <span className="font-bold text-white">{selected.disaster_type}</span>
                    <span className={`chip border ${SEVERITY_COLORS[selected.severity]} ml-auto`}>{selected.severity}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">{selected.description}</p>
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <VerificationStatusBadge status={selected.verification_status || 'pending'} />
                    {selected.trust_score !== null && <TrustScoreBadge score={selected.trust_score} />}
                    {selected.is_duplicate && (
                      <span className="chip border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] px-2 py-0.5">Possible Duplicate</span>
                    )}
                  </div>
                  {selected.location_label && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                      <MapPin className="w-3.5 h-3.5" /> {selected.location_label}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-command-border">
                    <Clock className="w-3.5 h-3.5" /> {new Date(selected.created_at).toLocaleString()}
                    {selected.reported_by && <span className="flex items-center gap-1 ml-2"><User className="w-3 h-3" /> {selected.reported_by}</span>}
                  </div>
                  {selected.ai_severity !== null && (
                    <div className="pt-2 border-t border-command-border mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-electric-400 mb-1">
                        <Zap className="w-3 h-3" /> AI Severity: {selected.ai_severity}/100
                        {selected.ai_confidence !== null && <span className="text-slate-500">· {selected.ai_confidence}% conf</span>}
                        {selected.image_authenticity !== null && <span className="text-slate-500">· {selected.image_authenticity}% auth</span>}
                      </div>
                      {selected.ai_summary && <p className="text-xs text-slate-400 mt-1">{selected.ai_summary}</p>}
                    </div>
                  )}
                </GlassCard>

                {/* Weather */}
                {weather && (
                  <GlassCard className="p-4 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CloudRain className="w-4 h-4 text-electric-400" />
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">Weather Summary</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">{weather.summary}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Thermometer className="w-3 h-3 text-orange-400" /> {Math.round(weather.temp)}°C</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Droplets className="w-3 h-3 text-electric-400" /> {weather.humidity}%</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Wind className="w-3 h-3 text-slate-400" /> {weather.wind_speed} m/s</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400"><Eye className="w-3 h-3" /> {weather.visibility}m</div>
                    </div>
                    {weather.alert && (
                      <div className="mt-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">{weather.alert}</div>
                    )}
                  </GlassCard>
                )}

                {/* Nearby services */}
                <GlassCard className="p-4 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Nearby Emergency Services</span>
                  </div>
                  {servicesLoading ? <Spinner label="Fetching..." /> : nearbyServices.length === 0 ? (
                    <p className="text-xs text-slate-500">No services found nearby.</p>
                  ) : (
                    <div className="space-y-2">
                      {nearbyServices.slice(0, 6).map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-white/5 border border-command-border">
                          {s.type === 'hospital' ? <Cross className="w-3.5 h-3.5 text-electric-400" />
                            : s.type === 'police' ? <Shield className="w-3.5 h-3.5 text-indigo-400" />
                            : s.type === 'fire' ? <Flame className="w-3.5 h-3.5 text-orange-400" />
                            : <Home className="w-3.5 h-3.5 text-emerald-400" />}
                          <div className="flex-1 min-w-0">
                            <div className="text-slate-300 truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-500">
                              {s.distance_km ? `${s.distance_km} km` : ''} {s.travel_time ? `· ${s.travel_time}` : ''}
                              {s.phone ? ` · ${s.phone}` : ''}
                            </div>
                          </div>
                          {s.lat && s.lng && (
                            <a href={`https://www.openstreetmap.org/directions?to=${s.lat}%2C${s.lng}`} target="_blank" rel="noreferrer"
                              className="grid place-items-center w-7 h-7 rounded-lg bg-electric-500/10 border border-electric-500/30 text-electric-400 hover:bg-electric-500/20 transition shrink-0">
                              <Navigation className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            ) : (
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-slate-500" />
                  <h3 className="font-display font-semibold text-white text-sm">Click a marker</h3>
                </div>
                <p className="text-sm text-slate-400">Select an incident marker on the map to view details, weather, and nearby emergency services.</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
