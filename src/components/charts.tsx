import { motion } from 'framer-motion';

export function BarChart({ data, labels, color = '#38bdf8' }: { data: number[]; labels: string[]; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
          <div className="w-full flex-1 flex items-end">
            <motion.div
              className="w-full rounded-t-md relative group-hover:opacity-90"
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: 'easeOut' }}
              style={{ background: `linear-gradient(to top, ${color}40, ${color})`, minHeight: '4px' }}
            >
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition">
                {v}
              </span>
            </motion.div>
          </div>
          <span className="text-[10px] text-slate-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#101a2e" strokeWidth="18" />
        {segments.map((s) => {
          const len = (s.value / total) * circumference;
          const el = (
            <motion.circle
              key={s.label} cx="80" cy="80" r={radius} fill="none"
              stroke={s.color} strokeWidth="18"
              strokeDasharray={`${len} ${circumference - len}`}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: -offset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          );
          offset += len;
          return el;
        })}
        <text x="80" y="76" textAnchor="middle" className="fill-white font-bold" fontSize="22">{total}</text>
        <text x="80" y="94" textAnchor="middle" className="fill-slate-400" fontSize="10">incidents</text>
      </svg>
      <div className="space-y-2 flex-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /> {s.label}
            </span>
            <span className="font-mono text-white">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 100, h = 100;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y] as [number, number];
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-40">
        <defs>
          <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path d={area} fill="url(#lineFill)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
        <motion.path d={path} fill="none" stroke="#38bdf8" strokeWidth="1.5" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, ease: 'easeOut' }} />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.5" fill="#38bdf8" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between mt-2">
        {labels.map((l) => <span key={l} className="text-[10px] text-slate-500">{l}</span>)}
      </div>
    </div>
  );
}
