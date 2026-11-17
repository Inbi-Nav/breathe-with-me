function Eyes({ mood, phase }) {
  const relaxed = mood === 'breathe' && phase === 'out';

  if (mood === 'celebrate') {
    return (
      <g className="mascot-line" fill="none" strokeWidth="3.4" strokeLinecap="round">
        <path d="M47 67 Q54 56 61 67" />
        <path d="M79 67 Q86 56 93 67" />
      </g>
    );
  }
  if (relaxed) {
    return (
      <g className="mascot-line" fill="none" strokeWidth="3.4" strokeLinecap="round">
        <path d="M47 62 Q54 70 61 62" />
        <path d="M79 62 Q86 70 93 62" />
      </g>
    );
  }
  return (
    <g>
      <g className="mascot-eyes">
        <ellipse cx="54" cy="63" rx="6" ry="8.5" className="mascot-eye" />
        <ellipse cx="86" cy="63" rx="6" ry="8.5" className="mascot-eye" />
        <circle cx="56" cy="60" r="2" fill="#fff" opacity="0.9" />
        <circle cx="88" cy="60" r="2" fill="#fff" opacity="0.9" />
      </g>
      {mood === 'care' && (
        <g className="mascot-line" strokeWidth="2.6" strokeLinecap="round">
          <path d="M46 50 L61 46" />
          <path d="M79 46 L94 50" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === 'celebrate') return <path d="M58 76 Q70 94 82 76 Z" className="mascot-mouth-fill" />;
  if (mood === 'care') return <path d="M63 81 Q70 84 77 81" className="mascot-line" fill="none" strokeWidth="3" strokeLinecap="round" />;
  return <path d="M60 77 Q70 85 80 77" className="mascot-line" fill="none" strokeWidth="3" strokeLinecap="round" />;
}

export default function Mascot({ mood = 'happy', level = 0, phase = null, size = 120 }) {
  const celebrate = mood === 'celebrate';
  return (
    <svg
      className={`mascot mascot-${mood}`}
      style={{ '--b': Number(level).toFixed(3), width: size, height: size * 1.07 }}
      viewBox="0 0 140 150"
      role="img"
      aria-label="Bree, your breathing guide"
    >
      <defs>
        <linearGradient id="bree-head" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4f6b" />
          <stop offset="1" stopColor="#22324a" />
        </linearGradient>
        <radialGradient id="bree-core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#c9ffe0" />
          <stop offset="1" stopColor="#4be08a" />
        </radialGradient>
      </defs>

      <g className="mascot-body">
        {/* antenna */}
        <line x1="70" y1="16" x2="70" y2="30" className="mascot-stroke" strokeWidth="3" strokeLinecap="round" />
        <circle cx="70" cy="11" r="6" fill="#4be08a" className="mascot-bulb" />

        {/* arms */}
        <rect x="14" y="92" width="16" height="34" rx="8" className="mascot-limb"
          transform={celebrate ? 'rotate(35 22 98)' : undefined} />
        <rect x="110" y="92" width="16" height="34" rx="8" className="mascot-limb"
          transform={celebrate ? 'rotate(-35 118 98)' : undefined} />

        {/* torso */}
        <rect x="36" y="102" width="68" height="40" rx="20" className="mascot-torso" />
        <circle cx="70" cy="122" r="7" fill="url(#bree-core)" className="mascot-core" />

        {/* head */}
        <rect x="14" y="54" width="9" height="24" rx="4.5" className="mascot-limb" />
        <rect x="117" y="54" width="9" height="24" rx="4.5" className="mascot-limb" />
        <rect x="22" y="30" width="96" height="76" rx="34" fill="url(#bree-head)" className="mascot-head" />
        <rect x="34" y="42" width="72" height="50" rx="22" className="mascot-screen" />

        <Eyes mood={mood} phase={phase} />
        <circle cx="42" cy="74" r="4.5" className="mascot-cheek" />
        <circle cx="98" cy="74" r="4.5" className="mascot-cheek" />
        <Mouth mood={mood} />
      </g>

      {celebrate && (
        <g className="mascot-sparks" fill="#e6c27a">
          <path d="M16 30l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M122 22l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" />
          <path d="M126 64l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" />
        </g>
      )}
    </svg>
  );
}
