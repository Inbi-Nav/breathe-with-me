const DOTS = [
  [200, 112], [158, 152], [242, 152], [200, 186], [200, 296], [128, 322], [272, 322]
];

export default function BodyScan() {
  return (
    <svg className="art art-body" viewBox="0 0 400 400" role="img" aria-label="Body outline showing the areas the camera reads">
      <g fill="none" stroke="#5ea8ff" strokeOpacity="0.45" strokeWidth="1.4">
        <ellipse cx="200" cy="150" rx="54" ry="68" />
        <path d="M178 214 L176 252 C140 262 96 280 84 372 M222 214 L224 252 C260 262 304 280 316 372" />
        <path d="M110 372 C120 310 160 290 200 290 C240 290 280 310 290 372" strokeOpacity="0.25" />
      </g>
      <g fill="none" stroke="#5ea8ff" strokeOpacity="0.12">
        <ellipse cx="200" cy="150" rx="74" ry="88" />
        <ellipse cx="200" cy="150" rx="96" ry="110" />
      </g>
      {DOTS.map(([x, y], i) => (
        <g key={i} className="scan-dot" style={{ animationDelay: `${i * 0.35}s` }}>
          <circle cx={x} cy={y} r="11" fill="#4be08a" opacity="0.18" />
          <circle cx={x} cy={y} r="5" fill="#4be08a" />
        </g>
      ))}
    </svg>
  );
}
