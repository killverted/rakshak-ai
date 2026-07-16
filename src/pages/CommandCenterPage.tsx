import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Activity, AlertTriangle, Users, Clock, TrendingUp,
  Radio, MapPin, ShieldCheck, Server, Cpu, Zap, Brain, FileText,
  UserCheck, Building2, Navigation, CloudRain, Wind, Thermometer, Eye,
  Droplets, Cross, Shield, Flame, Home, Phone, X, CheckCircle2,
  XCircle, AlertOctagon, Crosshair, Gauge, Layers, Radar,
  Cloud, Siren, ArrowUpRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { GlassCard, SectionHeader, Spinner, LiveBadge, ProgressBar, StatCard, EmptyState } from '../components/ui';
import { BarChart, Donut, LineChart } from '../components/charts';
import { LiveMap } from '../components/LiveMap';
import { VerificationCard, VerificationStatusBadge, TrustScoreBadge } from '../components/VerificationCard';
import { supabase, type Report, type NearbyService, type ActivityEntry, SEVERITY_COLORS, STATUS_COLORS } from '../lib/supabase';
import { fetchNearbyServices } from '../lib/nearby';
import { fetchWeather, type WeatherData } from '../lib/weather';
import { updateTrustScore } from '../lib/verification';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const RESCUE_TEAMS = [
  'NDRF Team Alpha', 'NDRF Team Bravo', 'NDRF Team Charlie',
  'State Rescue Unit 1', 'State Rescue Unit 2', 'Coast Guard Squad',
];

export function CommandCenterPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [nearbyServices, setNearbyServices] = useState<NearbyService[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mapCenter] = useState<[number, number]>([22.5937, 82.9629]);

  const loadReports = useCallback(async () => {
    const [{ data: r }, { data: a }] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(15),
    ]);
    setReports((r as Report[]) ?? []);
    setActivity((a as ActivityEntry[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const verifiedReports = useMemo(() => reports.filter(r => r.verification_status === 'verified'), [reports]);
  const pendingReports = useMemo(() => reports.filter(r => r.verification_status === 'pending' || !r.verification_status), [reports]);
  const suspiciousReports = useMemo(() => reports.filter(r => r.verification_status === 'suspicious'), [reports]);
  const criticalIncidents = useMemo(() => reports.filter(r => r.severity === 'critical' || r.severity === 'high'), [reports]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = { pending: 0, triaged: 0, responding: 0, resolved: 0 };
    reports.forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return map;
  }, [reports]);

  const byType = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => { map[r.disaster_type] = (map[r.disaster_type] ?? 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
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

  const selectReport = useCallback(async (r: Report) => {
    setSelectedReport(r);
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

  const handleAction = async (action: 'verify' | 'reject' | 'false' | 'assign' | 'close', report: Report, team?: string) => {
    setActionLoading(true);
    try {
      const updates: Record<string, unknown> = {};
      if (action === 'verify') {
        updates.verification_status = 'verified';
        updates.status = 'triaged';
        if (report.user_id) await updateTrustScore(report.user_id, 5, 'Report verified');
      } else if (action === 'reject') {
        updates.verification_status = 'suspicious';
        updates.status = 'resolved';
        if (report.user_id) await updateTrustScore(report.user_id, -10, 'Report rejected');
      } else if (action === 'false') {
        updates.verification_status = 'suspicious';
        updates.status = 'resolved';
        if (report.user_id) await updateTrustScore(report.user_id, -10, 'Report marked false');
      } else if (action === 'assign') {
        updates.assigned_rescue_team = team || 'Unassigned';
        updates.status = 'responding';
      } else if (action === 'close') {
        updates.status = 'resolved';
      }

      await supabase.from('reports').update(updates).eq('id', report.id);
      await supabase.from('activity_log').insert({
        action: `Incident ${action}`,
        detail: `${report.disaster_type} report ${action}${team ? ` to ${team}` : ''}`,
        severity: report.severity,
        actor: 'Admin',
      });

      await loadReports();
      if (selectedReport?.id === report.id) {
        setSelectedReport(prev => prev ? { ...prev, ...updates } as Report : null);
      }
    } catch (err) {
      console.error('[command-center] action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="grid place-items-center w-12 h-12 rounded-xl bg-emergency-500/10 border border-emergency-500/30 shadow-glow">
            <Radar className="w-6 h-6 text-emergency-400" />
          </span>
          <div>
            <p className="section-label mb-1">Emergency Operations</p>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-white">Command Center</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LiveBadge label="Live Feed" tone="emergency" />
            <LiveBadge label="Systems Online" tone="emerald" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Active Incidents" value={`${byStatus.pending + byStatus.responding}`} accent="emergency" trend="+12%" />
          <StatCard icon={<ShieldCheck className="w-5 h-5" />} label="Verified Reports" value={`${verifiedReports.length}`} accent="emerald" trend="+5" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Review" value={`${pendingReports.length}`} accent="amber" />
          <StatCard icon={<AlertOctagon className="w-5 h-5" />} label="Critical" value={`${criticalIncidents.length}`} accent="emergency" trend="+3" />
        </div>

        {/* Main grid: Map + side panel */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Live Map */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="lg:col-span-2">
            <GlassCard className="p-0 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-command-border">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emergency-400" />
                  <h3 className="font-display font-semibold text-white">Live India Map</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {reports.filter(r => r.lat).length} geo-located</span>
                  <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> Real-time</span>
                </div>
              </div>
              <div className="h-[500px] relative">
                <LiveMap reports={reports} nearbyServices={nearbyServices} center={mapCenter} zoom={5} showServices={!!selectedReport} />
              </div>
            </GlassCard>
          </motion.div>

          {/* Side panel: selected incident detail */}
          <div className="space-y-4">
            {selectedReport ? (
              <>
                <motion.div variants={fadeUp} initial="hidden" animate="show">
                  <GlassCard className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-semibold text-white">Incident Detail</h3>
                      <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {selectedReport.image_url && (
                      <img src={selectedReport.image_url} alt="disaster" className="w-full h-36 object-cover rounded-lg border border-command-border mb-3" />
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-emergency-400" />
                      <span className="font-bold text-white">{selectedReport.disaster_type}</span>
                      <span className={`chip border ${SEVERITY_COLORS[selectedReport.severity]} ml-auto`}>{selectedReport.severity}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">{selectedReport.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <VerificationStatusBadge status={selectedReport.verification_status || 'pending'} />
                      {selectedReport.trust_score !== null && <TrustScoreBadge score={selectedReport.trust_score} />}
                      {selectedReport.is_duplicate && (
                        <span className="chip border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] px-2 py-0.5">Duplicate</span>
                      )}
                    </div>
                    {selectedReport.ai_severity !== null && (
                      <div className="mt-3 pt-3 border-t border-command-border">
                        <div className="flex items-center gap-1.5 text-xs text-electric-400 mb-1">
                          <Zap className="w-3 h-3" /> AI: {selectedReport.ai_severity}/100 · {selectedReport.ai_confidence ?? 0}% conf
                        </div>
                        {selectedReport.ai_summary && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{selectedReport.ai_summary}</p>}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>

                {/* Admin actions */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }}>
                  <GlassCard className="p-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Admin Actions</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleAction('verify', selectedReport)} disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-500/20 transition disabled:opacity-50">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                      </button>
                      <button onClick={() => handleAction('reject', selectedReport)} disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emergency-500/10 border border-emergency-500/30 text-emergency-300 text-xs hover:bg-emergency-500/20 transition disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button onClick={() => handleAction('false', selectedReport)} disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs hover:bg-amber-500/20 transition disabled:opacity-50">
                        <AlertOctagon className="w-3.5 h-3.5" /> False
                      </button>
                      <button onClick={() => handleAction('close', selectedReport)} disabled={actionLoading}
                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-slate-500/10 border border-slate-500/30 text-slate-300 text-xs hover:bg-slate-500/20 transition disabled:opacity-50">
                        <X className="w-3.5 h-3.5" /> Close
                      </button>
                    </div>
                    <div className="mt-3">
                      <select
                        onChange={(e) => { if (e.target.value) handleAction('assign', selectedReport, e.target.value); }}
                        defaultValue=""
                        className="glass-input text-xs py-2"
                      >
                        <option value="" className="bg-command-surface">Assign Rescue Team...</option>
                        {RESCUE_TEAMS.map(t => <option key={t} value={t} className="bg-command-surface">{t}</option>)}
                      </select>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Weather */}
                {weather && (
                  <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }}>
                    <GlassCard className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CloudRain className="w-4 h-4 text-electric-400" />
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">Weather at Site</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400"><Thermometer className="w-3 h-3 text-orange-400" /> {Math.round(weather.temp)}°C</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400"><Droplets className="w-3 h-3 text-electric-400" /> {weather.humidity}%</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400"><Wind className="w-3 h-3 text-slate-400" /> {weather.wind_speed} m/s</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400"><Eye className="w-3 h-3 text-slate-400" /> {weather.visibility}m</div>
                      </div>
                      {weather.alert && (
                        <div className="mt-2 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2 py-1">{weather.alert}</div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}

                {/* Nearby services */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.15 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">Nearby Resources</span>
                    </div>
                    {servicesLoading ? <Spinner label="Fetching..." /> : nearbyServices.length === 0 ? (
                      <p className="text-xs text-slate-500">No services found nearby.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                        {nearbyServices.slice(0, 8).map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            {s.type === 'hospital' ? <Cross className="w-3 h-3 text-electric-400" />
                              : s.type === 'police' ? <Shield className="w-3 h-3 text-indigo-400" />
                              : s.type === 'fire' ? <Flame className="w-3 h-3 text-orange-400" />
                              : <Home className="w-3 h-3 text-emerald-400" />}
                            <span className="text-slate-300 truncate flex-1">{s.name}</span>
                            {s.distance_km && <span className="text-slate-500">{s.distance_km}km</span>}
                            {s.travel_time && <span className="text-slate-600">{s.travel_time}</span>}
                            {s.phone && <span className="text-electric-400"><Phone className="w-3 h-3" /></span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              </>
            ) : (
              <GlassCard className="p-8 text-center">
                <Crosshair className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <h3 className="font-display font-semibold text-white text-sm">Select an incident</h3>
                <p className="text-xs text-slate-400 mt-1.5">Click a marker on the map or a report below to view details and take action.</p>
              </GlassCard>
            )}
          </div>
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }}>
            <GlassCard className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-display font-semibold text-white">Incident Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">12-week overview</p>
                </div>
                <span className="chip border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><TrendingUp className="w-3.5 h-3.5" /> +24%</span>
              </div>
              <LineChart data={trendData} labels={trendLabels} />
            </GlassCard>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }}>
            <GlassCard className="p-6">
              <h3 className="font-display font-semibold text-white mb-1">Status Breakdown</h3>
              <p className="text-xs text-slate-400 mb-5">By response status</p>
              <Donut segments={donutSegments} />
            </GlassCard>
          </motion.div>
        </div>

        {/* Weekly + Disaster types */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }}>
            <GlassCard className="p-6 lg:col-span-2">
              <h3 className="font-display font-semibold text-white mb-1">Weekly Incidents</h3>
              <p className="text-xs text-slate-400 mb-5">Reports per day</p>
              <BarChart data={weeklyData} labels={weeklyLabels} color="#ef4444" />
            </GlassCard>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.35 }}>
            <GlassCard className="p-6">
              <h3 className="font-display font-semibold text-white mb-4">Top Disaster Types</h3>
              <div className="space-y-3">
                {byType.map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 flex-1 truncate">{type}</span>
                    <div className="w-16 h-1.5 rounded-full bg-command-surface border border-command-border overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-electric-500 to-electric-400 rounded-full" style={{ width: `${(count / reports.length) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-white w-6 text-right">{count}</span>
                  </div>
                ))}
                {byType.length === 0 && <p className="text-xs text-slate-500">No data yet.</p>}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Incident lists */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Pending */}
          <div>
            <SectionHeader title="Pending Verification" />
            {loading ? <Spinner label="Loading..." /> : pendingReports.length === 0 ? <EmptyState message="No pending reports." /> : (
              <div className="space-y-2">
                {pendingReports.slice(0, 6).map((r, i) => (
                  <motion.div key={r.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                    <GlassCard hover className="p-4 cursor-pointer" onClick={() => selectReport(r)}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-sm font-semibold text-white">{r.disaster_type}</span>
                        <span className={`chip border ${SEVERITY_COLORS[r.severity]} text-[10px] px-1.5 py-0.5 ml-auto`}>{r.severity}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>
                      <div className="text-[10px] text-slate-500 mt-1">{new Date(r.created_at).toLocaleString()}</div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Critical */}
          <div>
            <SectionHeader title="Critical Incidents" />
            {loading ? <Spinner label="Loading..." /> : criticalIncidents.length === 0 ? <EmptyState message="No critical incidents." /> : (
              <div className="space-y-2">
                {criticalIncidents.slice(0, 6).map((r, i) => (
                  <motion.div key={r.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.05 }}>
                    <GlassCard hover className="p-4 cursor-pointer" onClick={() => selectReport(r)}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-emergency-400" />
                        <span className="text-sm font-semibold text-white">{r.disaster_type}</span>
                        <span className={`chip border ${SEVERITY_COLORS[r.severity]} text-[10px] px-1.5 py-0.5 ml-auto`}>{r.severity}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>
                      {r.assigned_rescue_team && <div className="text-[10px] text-emerald-400 mt-1">Assigned: {r.assigned_rescue_team}</div>}
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Live activity */}
          <div>
            <SectionHeader title="Live Activity" />
            <GlassCard className="p-4">
              {loading ? <Spinner label="Loading..." /> : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto no-scrollbar">
                  {activity.map((a, i) => (
                    <motion.div key={a.id} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-white/5 transition">
                      <span className={`grid place-items-center w-7 h-7 rounded-lg shrink-0 border ${
                        a.severity === 'critical' ? 'bg-emergency-500/10 border-emergency-500/30 text-emergency-400'
                        : a.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                        : a.severity === 'moderate' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-electric-500/10 border-electric-500/30 text-electric-400'
                      }`}>
                        <Activity className="w-3.5 h-3.5" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white font-medium">{a.action}</div>
                        {a.detail && <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{a.detail}</div>}
                        <div className="text-[9px] text-slate-500 mt-0.5">{a.actor} · {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>

        {/* All reports table */}
        <div className="mb-6">
          <SectionHeader title="All Reports" subtitle="Complete incident log with verification status." />
          <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-command-border text-xs text-slate-400 uppercase tracking-wider">
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Severity</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Verification</th>
                    <th className="text-left p-3 font-medium">Trust</th>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="p-8"><Spinner label="Loading reports..." /></td></tr>
                  ) : reports.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-slate-400">No reports yet.</td></tr>
                  ) : reports.slice(0, 15).map((r) => (
                    <tr key={r.id} className="border-b border-command-border hover:bg-white/5 transition cursor-pointer" onClick={() => selectReport(r)}>
                      <td className="p-3 text-white font-medium">{r.disaster_type}</td>
                      <td className="p-3"><span className={`chip border ${SEVERITY_COLORS[r.severity]} text-[10px] px-2 py-0.5`}>{r.severity}</span></td>
                      <td className="p-3"><span className={`chip border ${STATUS_COLORS[r.status]} text-[10px] px-2 py-0.5`}>{r.status}</span></td>
                      <td className="p-3"><VerificationStatusBadge status={r.verification_status || 'pending'} /></td>
                      <td className="p-3">{r.trust_score !== null ? <TrustScoreBadge score={r.trust_score} /> : <span className="text-slate-500 text-xs">—</span>}</td>
                      <td className="p-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button onClick={(e) => { e.stopPropagation(); handleAction('verify', r); }} className="grid place-items-center w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition" title="Verify"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleAction('reject', r); }} className="grid place-items-center w-7 h-7 rounded-lg bg-emergency-500/10 border border-emergency-500/30 text-emergency-400 hover:bg-emergency-500/20 transition" title="Reject"><XCircle className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
