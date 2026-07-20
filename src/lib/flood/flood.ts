export async function verifyFlood(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lng}&daily=river_discharge_mean&forecast_days=1`
      );
  
      const data = await res.json();
  
      const discharge = data.daily?.river_discharge_mean?.[0] ?? 0;
  
      return {
        verified: discharge > 100,
        discharge,
        source: "Open-Meteo Flood API",
      };
    } catch (err) {
      console.error(err);
  
      return {
        verified: false,
        discharge: 0,
        source: "Open-Meteo Flood API",
      };
    }
  }