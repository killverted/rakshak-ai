import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

if (!isSupabaseConfigured) {
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Add them to a .env file to enable authentication and database features.',
  );
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anon || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export type Report = {
  id: string;
  user_id: string;
  disaster_type: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  status: 'pending' | 'triaged' | 'responding' | 'resolved';
  lat: number | null;
  lng: number | null;
  location_label: string | null;
  image_url: string | null;
  ai_severity: number | null;
  ai_summary: string | null;
  ai_severity_label: 'Low' | 'Medium' | 'High' | 'Critical' | null;
  ai_confidence: number | null;
  ai_hazards: string[] | null;
  ai_safety_actions: string[] | null;
  ai_priority_level: string | null;
  ai_estimated_affected_area: string | null;
  ai_analyzed_at: string | null;
  verification_status: string | null;
  trust_score: number | null;
  image_authenticity: number | null;
  is_duplicate: boolean;
  duplicate_of: string | null;
  weather_temp: number | null;
  weather_humidity: number | null;
  weather_wind_speed: number | null;
  weather_rainfall: number | null;
  weather_visibility: number | null;
  weather_alert: string | null;
  weather_summary: string | null;
  nearby_services: NearbyService[] | null;
  assigned_rescue_team: string | null;
  reported_by: string | null;
  created_at: string;
};

export type NearbyService = {
  name: string;
  type: 'hospital' | 'police' | 'fire' | 'shelter';
  lat: number;
  lng: number;
  distance_km: number | null;
  travel_time: string | null;
  phone: string | null;
};

export type AIAnalysisResult = {
  disaster_type: string;
  severity_label: 'Low' | 'Medium' | 'High' | 'Critical';
  severity_score: number;
  confidence: number;
  image_authenticity: number;
  hazards: string[];
  safety_actions: string[];
  summary: string;
  estimated_affected_area: string;
  priority_level: string;
};

export type Profile = {
  id: string;
  user_id: string;
  trust_score: number;
  trust_history: { action: string; delta: number; timestamp: string }[];
  full_name: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type Volunteer = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  skills: string[];
  availability: 'available' | 'on-mission' | 'offline';
  region: string | null;
  missions_completed: number;
  created_at: string;
};

export type ActivityEntry = {
  id: string;
  user_id: string | null;
  actor: string;
  action: string;
  detail: string | null;
  severity: 'info' | 'moderate' | 'high' | 'critical';
  created_at: string;
};

export const DISASTER_TYPES = [
  'Flood',
  'Fire',
  'Earthquake',
  'Cyclone',
  'Landslide',
  'Industrial Accident',
  'Building Collapse',
  'Chemical Spill',
  'Water Crisis',
  'Other',
] as const;

export const SEVERITY_COLORS: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  critical: 'text-emergency-400 bg-emergency-500/10 border-emergency-500/30',
};

export const STATUS_COLORS: Record<string, string> = {
  pending: 'text-slate-300 bg-white/5 border-white/15',
  triaged: 'text-electric-400 bg-electric-500/10 border-electric-500/30',
  responding: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};
