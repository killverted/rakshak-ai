export function IndiaMap({ className = '' }: { className?: string }) {
  // Simplified India outline path for decorative purposes
  return (
    <svg viewBox="0 0 400 480" className={className} fill="none">
      <defs>
        <filter id="indiaGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="indiaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="indiaCenter" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Simplified India silhouette */}
      <path
        d="M180 30 L210 25 L240 35 L255 50 L270 45 L280 55 L275 70 L285 80 L280 95 L270 100 L265 115 L280 130 L290 145 L285 160 L270 170 L280 185 L290 200 L300 220 L310 250 L315 280 L310 310 L300 340 L280 370 L260 390 L245 410 L235 430 L225 445 L215 455 L205 450 L200 435 L190 420 L175 410 L160 400 L145 380 L130 360 L115 340 L100 310 L85 280 L75 250 L65 220 L60 190 L55 160 L50 130 L55 100 L65 75 L80 55 L100 40 L130 30 L155 28 Z"
        fill="url(#indiaFill)"
        stroke="#38bdf8"
        strokeWidth="1.5"
        filter="url(#indiaGlow)"
        opacity="0.7"
      />

      {/* Inner glow */}
      <circle cx="200" cy="200" r="120" fill="url(#indiaCenter)" />

      {/* Major city dots with glow */}
      {[
        { cx: 165, cy: 120, name: 'Delhi' },
        { cx: 140, cy: 280, name: 'Mumbai' },
        { cx: 220, cy: 350, name: 'Chennai' },
        { cx: 250, cy: 200, name: 'Kolkata' },
        { cx: 150, cy: 200, name: 'Nagpur' },
        { cx: 200, cy: 150, name: 'Lucknow' },
        { cx: 130, cy: 240, name: 'Pune' },
        { cx: 240, cy: 280, name: 'Hyderabad' },
      ].map((city) => (
        <g key={city.name}>
          <circle cx={city.cx} cy={city.cy} r="2.5" fill="#38bdf8" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={city.cx} cy={city.cy} r="5" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.3">
            <animate attributeName="r" values="3;10;3" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
          </circle>
        </g>
      ))}

      {/* Incident pulse markers */}
      {[
        { cx: 180, cy: 320, color: '#ef4444' },
        { cx: 230, cy: 150, color: '#f59e0b' },
        { cx: 145, cy: 260, color: '#ef4444' },
      ].map((m, i) => (
        <g key={i}>
          <circle cx={m.cx} cy={m.cy} r="4" fill={m.color} opacity="0.6">
            <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={m.cx} cy={m.cy} r="2" fill={m.color} />
        </g>
      ))}
    </svg>
  );
}
