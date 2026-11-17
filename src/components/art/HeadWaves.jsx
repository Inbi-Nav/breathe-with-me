function wavePath(index) {
  const points = [];
  const amp = 46 - index * 6.5;
  for (let x = 10; x <= 390; x += 4) {
    const envelope =
      Math.exp(-(((x - 135) / 55) ** 2)) + 0.85 * Math.exp(-(((x - 235) / 48) ** 2));
    const y = 200 + Math.sin((x - 10) * 0.075 + index * 0.35) * amp * envelope;
    points.push(`${x},${y.toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

export default function HeadWaves() {
  return (
    <svg className="art art-head" viewBox="0 0 400 400" role="img" aria-label="Breathing waveform inside a head outline">
      <defs>
        <linearGradient id="hw-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5ea8ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#bfe0ff" />
          <stop offset="1" stopColor="#5ea8ff" stopOpacity="0.2" />
        </linearGradient>
        <radialGradient id="hw-fill" cx="0.45" cy="0.45" r="0.7">
          <stop offset="0" stopColor="#5ea8ff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#5ea8ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        className="art-outline"
        fill="url(#hw-fill)"
        d="M200 90 C250 78 292 110 296 160 C298 182 308 196 322 214 C326 220 322 226 314 227 C318 236 312 242 304 243 C306 256 300 266 286 268 L284 300 C282 316 260 322 240 324 L240 350 L150 350 L150 300 C120 280 108 240 112 200 C116 140 150 100 200 90 Z"
      />
      <g className="art-waves" fill="none" strokeWidth="1.2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <path key={i} d={wavePath(i)} stroke="url(#hw-stroke)" opacity={1 - i * 0.12} />
        ))}
      </g>
      <line x1="10" y1="200" x2="390" y2="200" stroke="url(#hw-stroke)" strokeWidth="1.6" />
    </svg>
  );
}
