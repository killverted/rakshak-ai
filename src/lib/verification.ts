import { supabase, type Report, type AIAnalysisResult, type NearbyService } from './supabase';
import { fetchNearbyServices } from './nearby';
import { fetchWeather, type WeatherData } from './weather';
import { verifyFireWithNASA } from "./nasa";
import { verifyFlood } from "./flood";
export type VerificationResult = {
  status: 'verified' | 'pending' | 'suspicious';
  trust_score: number;
  is_duplicate: boolean;
  duplicate_of: string | null;
  nearby_count: number;
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Search for similar incidents within 1 km and last 30 minutes.
 */
export async function detectDuplicates(
  lat: number,
  lng: number,
  disasterType: string,
  excludeId?: string
): Promise<{ isDuplicate: boolean; duplicateOf: string | null; nearbyCount: number }> {
  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('reports')
      .select('id, lat, lng, disaster_type, created_at')
      .eq('disaster_type', disasterType)
      .gte('created_at', thirtyMinAgo)
      .neq('id', excludeId || '00000000-0000-0000-0000-000000000000');

    if (!data || data.length === 0) return { isDuplicate: false, duplicateOf: null, nearbyCount: 0 };

    const nearby = data.filter((r) => {
      if (r.lat == null || r.lng == null) return false;
      return haversineKm(lat, lng, r.lat, r.lng) <= 1.0;
    });

    if (nearby.length > 0) {
      return {
        isDuplicate: true,
        duplicateOf: nearby[0].id,
        nearbyCount: nearby.length,
      };
    }

    return { isDuplicate: false, duplicateOf: null, nearbyCount: 0 };
  } catch (err) {
    console.warn('[verification] duplicate detection failed:', err);
    return { isDuplicate: false, duplicateOf: null, nearbyCount: 0 };
  }
}

/**
 * Calculate trust score (0-100) from AI confidence, image authenticity,
 * reporter trust score, and nearby similar reports.
 */
export function calculateTrustScore(
  aiConfidence: number,
  imageAuthenticity: number,
  reporterTrustScore: number,
  nearbyCount: number,
  isDuplicate: boolean
): number {
  const aiWeight = 0.35;
  const authWeight = 0.25;
  const reporterWeight = 0.25;
  const nearbyWeight = 0.15;

  const nearbyScore = isDuplicate
    ? Math.min(100, 60 + nearbyCount * 20)
    : Math.min(100, nearbyCount * 15);

  const score =
    aiConfidence * aiWeight +
    imageAuthenticity * authWeight +
    reporterTrustScore * reporterWeight +
    nearbyScore * nearbyWeight;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Determine verification status from trust score.
 */
export function getVerificationStatus(trustScore: number): 'verified' | 'pending' | 'suspicious' {
  if (trustScore >= 70) return 'verified';
  if (trustScore >= 40) return 'pending';
  return 'suspicious';
}

/**
 * Get or create a user's profile with trust score.
 */
export async function getOrCreateProfile(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('trust_score')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) return data.trust_score;

    await supabase.from('profiles').insert({ user_id: userId }).maybeSingle();
    return 50;
  } catch {
    return 50;
  }
}

/**
 * Update a user's trust score by a delta.
 */
export async function updateTrustScore(userId: string, delta: number, action: string): Promise<void> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('trust_score, trust_history')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) return;

    const newScore = Math.max(0, Math.min(100, data.trust_score + delta));
    const history = Array.isArray(data.trust_history) ? data.trust_history : [];
    history.push({ action, delta, timestamp: new Date().toISOString() });

    await supabase
      .from('profiles')
      .update({ trust_score: newScore, trust_history: history, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch (err) {
    console.warn('[verification] trust score update failed:', err);
  }
}

/**
 * Full verification pipeline: run AI analysis, detect duplicates,
 * calculate trust score, fetch weather and nearby services.
 */
export async function runVerificationPipeline(
  reportId: string,
  report: { lat: number | null; lng: number | null; disaster_type: string; user_id: string | null },
  aiResult: AIAnalysisResult
): Promise<VerificationResult> {
  const lat = report.lat;
  const lng = report.lng;

  // Duplicate detection
  let dupResult = { isDuplicate: false, duplicateOf: null as string | null, nearbyCount: 0 };
  if (lat !== null && lng !== null) {
    dupResult = await detectDuplicates(lat, lng, report.disaster_type, reportId);
  }

  // Reporter trust score
  const reporterScore = report.user_id ? await getOrCreateProfile(report.user_id) : 50;

  // Trust score calculation
  const trustScore = calculateTrustScore(
    aiResult.confidence,
    aiResult.image_authenticity ?? 50,
    reporterScore,
    dupResult.nearbyCount,
    dupResult.isDuplicate
  );

  const status = getVerificationStatus(trustScore);

  // Weather + nearby services (if coordinates available)
  let weather: WeatherData | null = null;
  let nearby: NearbyService[] = [];
  if (lat !== null && lng !== null) {
    weather = await fetchWeather(lat, lng);
    nearby = await fetchNearbyServices(
      lat,
      lng,
      report.disaster_type
    );
  }
  let nasaResult = {
    verified: false,
    hotspotCount: 0,
  };
  
  if (
    lat !== null &&
    lng !== null &&
    report.disaster_type.toLowerCase() === "fire"
  ) {
    nasaResult = await verifyFireWithNASA(lat, lng);
  } 
  let floodResult = {
    verified: false,
    discharge: 0,
    source: "Open-Meteo Flood API",
  };
  
  if (
    lat !== null &&
    lng !== null &&
    report.disaster_type.toLowerCase() === "flood"
  ) {
    console.log("Disaster Type =", report.disaster_type);
    console.log("VERIFY FLOOD CALLED");
  
    floodResult = await verifyFlood(lat, lng);
  
    console.log("Flood Result =", floodResult);
  }
  // Update the report with all verification data
  const updateData: Record<string, unknown> = {
    verification_status: status,
    trust_score: trustScore,
    image_authenticity: aiResult.image_authenticity,
  
    nasa_verified: nasaResult.verified,
    nasa_hotspots: nasaResult.hotspotCount,
    flood_verified: floodResult.verified,
river_discharge: floodResult.discharge,
flood_source: floodResult.source,
  
    is_duplicate: dupResult.isDuplicate,
    duplicate_of: dupResult.duplicateOf,
    nearby_services: nearby.length > 0 ? nearby : null,
  };
  console.log("Saving verification", {
    nasaResult,
    floodResult,
    status,
    nearby,
  });

  if (weather) {
    updateData.weather_temp = weather.temp;
    updateData.weather_humidity = weather.humidity;
    updateData.weather_wind_speed = weather.wind_speed;
    updateData.weather_rainfall = weather.rainfall;
    updateData.weather_visibility = weather.visibility;
    updateData.weather_alert = weather.alert;
    updateData.weather_summary = weather.summary;
  }

  await supabase.from('reports').update(updateData).eq('id', reportId);

  return {
    status,
    trust_score: trustScore,
    is_duplicate: dupResult.isDuplicate,
    duplicate_of: dupResult.duplicateOf,
    nearby_count: nearby.length,
  };
}
