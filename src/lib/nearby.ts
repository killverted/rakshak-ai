import type { NearbyService } from './supabase';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const QUERIES: Record<string, string> = {
  hospital: 'amenity=hospital',
  police: 'amenity=police',
  fire: 'amenity=fire_station',
  shelter: 'amenity=shelter|social_facility=shelter',
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

function estimateTravelTime(km: number): string {
  const minutes = Math.round((km / 30) * 60);
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export async function fetchNearbyServices(lat: number, lng: number, radiusM = 5000): Promise<NearbyService[]> {
  const types = Object.keys(QUERIES);
  const results: NearbyService[] = [];

  for (const type of types) {
    try {
      const query = `[out:json][timeout:10];(
        node[${QUERIES[type]}](around:${radiusM},${lat},${lng});
        way[${QUERIES[type]}](around:${radiusM},${lat},${lng});
      );out center 20;`;

      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const el of (data.elements || [])) {
        const eLat = el.lat ?? el.center?.lat;
        const eLng = el.lon ?? el.center?.lon;
        if (eLat == null || eLng == null) continue;

        const name = el.tags?.name || el.tags?.['name:en'] || `${type.charAt(0).toUpperCase() + type.slice(1)}`;
        const dist = haversineKm(lat, lng, eLat, eLng);
        const phone = el.tags?.phone || el.tags?.['contact:phone'] || el.tags?.['phone:mobile'] || null;

        results.push({
          name,
          type: type as NearbyService['type'],
          lat: eLat,
          lng: eLng,
          distance_km: Math.round(dist * 10) / 10,
          travel_time: estimateTravelTime(dist),
          phone,
        });
      }
    } catch (err) {
      console.warn(`[nearby] ${type} fetch failed:`, err);
    }
  }

  return results.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0)).slice(0, 20);
}
