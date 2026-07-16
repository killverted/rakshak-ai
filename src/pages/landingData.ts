import {
  ShieldAlert, Activity, Brain, MapPin, Siren, Users, Radio, Satellite,
  CloudRain, Flame, Waves, Mountain, Wind, Factory, Building2, Droplets,
  ArrowRight, Phone, Zap, Eye, Cpu, LineChart, LifeBuoy, TrendingUp,
} from 'lucide-react';

export const STATS = [
  { icon: Activity, label: 'Incidents managed', value: 48200, suffix: '+', trend: '+12%', accent: 'electric' as const },
  { icon: Users, label: 'Active volunteers', value: 12800, suffix: '', trend: '+8%', accent: 'emerald' as const },
  { icon: Zap, label: 'Avg response time', value: 6.4, suffix: ' min', trend: '-18%', accent: 'amber' as const, decimals: 1 },
  { icon: LifeBuoy, label: 'Lives assisted', value: 93500, suffix: '', trend: '+22%', accent: 'emergency' as const },
];

export const CATEGORIES = [
  { icon: CloudRain, name: 'Flood', desc: 'Rising water, urban flooding, dam overflow' },
  { icon: Flame, name: 'Fire', desc: 'Structural, wildfire, industrial blaze' },
  { icon: Waves, name: 'Earthquake', desc: 'Tremors, aftershocks, structural damage' },
  { icon: Wind, name: 'Cyclone', desc: 'Storm surge, high winds, coastal impact' },
  { icon: Mountain, name: 'Landslide', desc: 'Mudslides, rockfall, terrain collapse' },
  { icon: Factory, name: 'Industrial', desc: 'Chemical spills, gas leaks, explosions' },
  { icon: Building2, name: 'Collapse', desc: 'Building failure, infrastructure damage' },
  { icon: Droplets, name: 'Water Crisis', desc: 'Contamination, shortage, supply failure' },
];

export const FEATURES = [
  { icon: Brain, title: 'AI Image Analysis', desc: 'Upload disaster imagery and our Gemini vision model detects damage type, estimates severity, and flags structural risk in seconds.' },
  { icon: MapPin, title: 'Live Disaster Map', desc: 'Real-time incident heatmap with geolocation, severity overlays, and resource positioning across affected zones.' },
  { icon: Siren, title: 'One-Tap SOS', desc: 'Citizens broadcast location and emergency context to the nearest response teams with a single action.' },
  { icon: Users, title: 'Volunteer Network', desc: 'Coordinate a verified volunteer force with skills matching, availability tracking, and mission assignment.' },
  { icon: Radio, title: 'Unified Response', desc: 'Connect citizens, volunteers, and authorities on a single operational picture with shared situational awareness.' },
  { icon: LineChart, title: 'Admin Analytics', desc: 'Live dashboards with incident trends, response metrics, and resource allocation analytics for decision makers.' },
];

export const AI_CAPS = [
  { icon: Eye, title: 'Computer Vision', desc: 'Satellite & drone imagery analyzed for flood extent, fire spread, and structural integrity.' },
  { icon: Cpu, title: 'Severity Scoring', desc: 'Models estimate incident severity on a 0–100 scale from images and contextual reports.' },
  { icon: Satellite, title: 'Predictive Alerts', desc: 'Weather and terrain data fused to forecast cascading events before they escalate.' },
  { icon: Zap, title: 'Triage Routing', desc: 'AI prioritizes incidents and routes the closest qualified responders automatically.' },
];

export const CONTACTS = [
  { label: 'NDRF', number: '1070', desc: 'National Disaster Response Force' },
  { label: 'Fire', number: '101', desc: 'Fire & rescue services' },
  { label: 'Ambulance', number: '108', desc: 'Emergency medical services' },
  { label: 'Helpline', number: '112', desc: 'Unified emergency number' },
];

export const TICKER_ITEMS = [
  { text: 'Cyclone warning issued for coastal Tamil Nadu', severity: 'high' },
  { text: 'Flood alert: Yamuna river level rising in Delhi', severity: 'critical' },
  { text: 'NDRF teams deployed to Assam flood zones', severity: 'moderate' },
  { text: 'Fire contained at industrial unit in Pune', severity: 'low' },
  { text: 'Earthquake tremors felt in Uttarakhand, no damage reported', severity: 'moderate' },
  { text: 'Landslide blocks highway in Himachal Pradesh', severity: 'high' },
  { text: 'AI analysis: 12 new reports triaged automatically', severity: 'low' },
  { text: 'Volunteer network: 340 responders activated nationwide', severity: 'moderate' },
];

export {
  ShieldAlert, ArrowRight, Phone, TrendingUp, Siren, Brain,
};
