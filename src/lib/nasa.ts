export type NASAFireResult = {
    verified: boolean;
    hotspotCount: number;
  };
  
  export async function verifyFireWithNASA(lat:number,lng:number){
    const token = import.meta.env.VITE_NASA_BEARER_TOKEN;
  
    if(!token){
      return {verified:false,hotspotCount:0};
    }
  
    const bbox =
      `${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}`;
  
    const url =
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${token}/VIIRS_SNPP_NRT/${bbox}/1`;
  
    try{
  
      const res=await fetch(url);
      console.log("NASA Response:",res.status);
  
      if(!res.ok)
        return {verified:false,hotspotCount:0};
  
      const csv=await res.text();
      console.log(csv)
  
      const rows=csv.trim().split("\n");
  
      return{
        verified:rows.length>1,
        hotspotCount:Math.max(0,rows.length-1)
      };
  
    }catch{
  
      return{
        verified:false,
        hotspotCount:0
      }
  
    }
  
  }