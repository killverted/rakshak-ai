export type WeatherData = {
  temp: number;
  humidity: number;
  wind_speed: number;
  rainfall: number;
  visibility: number;
  alert: string | null;
  summary: string;
};

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('[weather] VITE_OPENWEATHER_API_KEY not set — weather data unavailable');
    return null;
  }

  try {
    const url = `${OPENWEATHER_BASE}?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[weather] OpenWeather API returned ${res.status}`);
      return null;
    }
    const data = await res.json();

    const rain = data.rain?.['1h'] ?? data.rain?.['3h'] ?? 0;
    const alert = data.weather?.find((w: { main: string }) =>
      ['Thunderstorm', 'Extreme', 'Tornado', 'Flood', 'Hurricane'].includes(w.main)
    )?.main ?? null;

    const summary = [
      `${Math.round(data.main?.temp ?? 0)}°C`,
      data.weather?.[0]?.description ?? 'clear',
      `${data.main?.humidity ?? 0}% humidity`,
      `${data.wind?.speed ?? 0} m/s wind`,
    ].join(', ');

    return {
      temp: data.main?.temp ?? 0,
      humidity: data.main?.humidity ?? 0,
      wind_speed: data.wind?.speed ?? 0,
      rainfall: rain,
      visibility: data.visibility ?? 10000,
      alert,
      summary,
    };
  } catch (err) {
    console.warn('[weather] fetch failed:', err);
    return null;
  }
}
