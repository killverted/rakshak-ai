import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Clock, User, Zap, ShieldCheck, ShieldAlert,
  CloudRain, Wind, Thermometer, Eye, Droplets, Navigation, Phone,
  Cross, Shield, Flame, Home, MapPin,
} from 'lucide-react';
import type { Report, NearbyService } from '../lib/supabase';

// Fix default icon issue with Leaflet in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function severityIcon(severity: string, verification: string): L.DivIcon {
  const color =
    severity === 'critical' ? '#ef4444'
    : severity === 'high' ? '#f97316'
    : severity === 'moderate' ? '#f59e0b'
    : '#10b981';

  const ringColor =
    verification === 'verified' ? '#10b981'
    : verification === 'suspicious' ? '#ef4444'
    : '#f59e0b';

  return L.divIcon({
    className: 'rakshak-marker',
    html: `<div style="position:relative;width:28px;height:28px;">
      <div class="rakshak-marker-pulse" style="width:28px;height:28px;background:${color}40;border:2px solid ${color};"></div>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:${color};border:2px solid ${ringColor};box-shadow:0 0 8px ${color}80;"></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function serviceIcon(type: string): L.DivIcon {
  const colors: Record<string, string> = {
    hospital: '#38bdf8',
    police: '#818cf8',
    fire: '#f97316',
    shelter: '#10b981',
  };
  const c = colors[type] || '#94a3b8';
  return L.divIcon({
    className: 'rakshak-marker',
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${c}30;border:2px solid ${c};box-shadow:0 0 6px ${c}60;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function RecenterButton({ center }: { center: [number, number] }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.flyTo(center, 13, { duration: 1.5 })}
      className="absolute top-4 right-4 z-[1000] grid place-items-center w-10 h-10 rounded-lg glass border border-command-border hover:border-electric-400/50 transition"
      title="Recenter map"
    >
      <Navigation className="w-4 h-4 text-electric-400" />
    </button>
  );
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });
    return () => { map.off('click'); };
  }, [map, onMapClick]);
  return null;
}

export type LiveMapProps = {
  reports: Report[];
  nearbyServices?: NearbyService[];
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  showServices?: boolean;
  className?: string;
};

const INDIA_CENTER: [number, number] = [22.5937, 82.9629];

export function LiveMap({
  reports, nearbyServices = [], center = INDIA_CENTER, zoom = 5,
  onMapClick, showServices = false, className = '',
}: LiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const validReports = useMemo(
    () => reports.filter((r) => r.lat !== null && r.lng !== null),
    [reports]
  );

  return (
    <div className={`relative w-full h-full ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-xl"
        style={{ background: '#0a0e1a', zIndex: 1 }}
        ref={(m) => { mapRef.current = m; }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <RecenterButton center={center} />
        <MapEvents onMapClick={onMapClick} />

        {/* Report markers */}
        {validReports.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat!, r.lng!]}
            icon={severityIcon(r.severity, r.verification_status || 'pending')}
          >
            <Popup>
              <ReportPopup report={r} />
            </Popup>
          </Marker>
        ))}

        {/* Warning zones for critical/high severity */}
        {validReports.filter((r) => r.severity === 'critical' || r.severity === 'high').map((r) => (
          <Circle
            key={`zone-${r.id}`}
            center={[r.lat!, r.lng!]}
            radius={1000}
            pathOptions={{
              color: r.severity === 'critical' ? '#ef4444' : '#f97316',
              fillColor: r.severity === 'critical' ? '#ef4444' : '#f97316',
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '4 4',
            }}
          />
        ))}

        {/* Nearby services */}
        {showServices && nearbyServices.map((s, i) => (
          <Marker
            key={`svc-${i}`}
            position={[s.lat, s.lng]}
            icon={serviceIcon(s.type)}
          >
            <Popup>
              <ServicePopup service={s} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function ReportPopup({ report }: { report: Report }) {
  const vStatus = report.verification_status || 'pending';
  const vColor =
    vStatus === 'verified' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    : vStatus === 'suspicious' ? 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30'
    : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

  const vIcon =
    vStatus === 'verified' ? <ShieldCheck className="w-3 h-3" />
    : vStatus === 'suspicious' ? <ShieldAlert className="w-3 h-3" />
    : <Clock className="w-3 h-3" />;

  return (
    <div className="p-3 space-y-2.5" style={{ background: 'transparent' }}>
      {/* Image */}
      {report.image_url && (
        <img
          src={report.image_url}
          alt="disaster"
          className="w-full h-32 object-cover rounded-lg border border-white/10"
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-emergency-400 shrink-0" />
        <span className="font-bold text-white text-sm">{report.disaster_type}</span>
        <span className={`ml-auto chip border text-[10px] px-2 py-0.5 rounded-full ${vColor}`}>
          {vIcon} {vStatus}
        </span>
      </div>

      {/* AI scores */}
      {report.ai_severity !== null && (
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-electric-400">
            <Zap className="w-3 h-3" /> {report.ai_severity}/100
          </span>
          {report.ai_confidence !== null && (
            <span className="flex items-center gap-1 text-slate-400">
              Conf: {report.ai_confidence}%
            </span>
          )}
          {report.image_authenticity !== null && (
            <span className="flex items-center gap-1 text-slate-400">
              Auth: {report.image_authenticity}%
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      {report.ai_summary && (
        <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
          {report.ai_summary}
        </p>
      )}

      {/* Time + reporter */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-white/10">
        <span className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> {new Date(report.created_at).toLocaleString()}
        </span>
        {report.reported_by && (
          <span className="flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> {report.reported_by}
          </span>
        )}
      </div>

      {/* Weather */}
      {report.weather_summary && (
        <div className="pt-1 border-t border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-electric-400 mb-1">
            <CloudRain className="w-2.5 h-2.5" /> Weather
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
            {report.weather_temp !== null && (
              <span className="flex items-center gap-1"><Thermometer className="w-2.5 h-2.5" /> {report.weather_temp}°C</span>
            )}
            {report.weather_humidity !== null && (
              <span className="flex items-center gap-1"><Droplets className="w-2.5 h-2.5" /> {report.weather_humidity}%</span>
            )}
            {report.weather_wind_speed !== null && (
              <span className="flex items-center gap-1"><Wind className="w-2.5 h-2.5" /> {report.weather_wind_speed} m/s</span>
            )}
            {report.weather_visibility !== null && (
              <span className="flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {report.weather_visibility}m</span>
            )}
          </div>
          {report.weather_alert && (
            <div className="mt-1 text-[10px] text-amber-400 bg-amber-500/10 rounded px-1.5 py-0.5">
              {report.weather_alert}
            </div>
          )}
        </div>
      )}

      {/* Nearby services count */}
      {report.nearby_services && Array.isArray(report.nearby_services) && report.nearby_services.length > 0 && (
        <div className="pt-1 border-t border-white/10">
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-1">
            <MapPin className="w-2.5 h-2.5" /> Nearby Emergency Services
          </div>
          <div className="space-y-0.5">
            {(report.nearby_services as NearbyService[]).slice(0, 3).map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-[10px] text-slate-400">
                {s.type === 'hospital' ? <Cross className="w-2.5 h-2.5" />
                  : s.type === 'police' ? <Shield className="w-2.5 h-2.5" />
                  : s.type === 'fire' ? <Flame className="w-2.5 h-2.5" />
                  : <Home className="w-2.5 h-2.5" />}
                <span className="truncate">{s.name}</span>
                <span className="ml-auto text-slate-500">{s.distance_km ? `${s.distance_km}km` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ServicePopup({ service }: { service: NearbyService }) {
  const icons: Record<string, React.ReactNode> = {
    hospital: <Cross className="w-4 h-4 text-electric-400" />,
    police: <Shield className="w-4 h-4 text-indigo-400" />,
    fire: <Flame className="w-4 h-4 text-orange-400" />,
    shelter: <Home className="w-4 h-4 text-emerald-400" />,
  };
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        {icons[service.type] || <MapPin className="w-4 h-4 text-slate-400" />}
        <span className="font-bold text-white text-sm">{service.name}</span>
      </div>
      <div className="space-y-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1">
          <Navigation className="w-3 h-3" /> {service.distance_km ? `${service.distance_km} km` : 'Distance N/A'}
          {service.travel_time && <span className="ml-1">· {service.travel_time}</span>}
        </div>
        {service.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" /> {service.phone}
          </div>
        )}
      </div>
      {service.lat && service.lng && (
        <a
          href={`https://www.openstreetmap.org/directions?from=&to=${service.lat}%2C${service.lng}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-electric-500/10 border border-electric-500/30 text-electric-300 text-[11px] hover:bg-electric-500/20 transition"
        >
          <Navigation className="w-3 h-3" /> Navigate
        </a>
      )}
    </div>
  );
}
