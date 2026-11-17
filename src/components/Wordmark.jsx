export default function Wordmark({ size = 'lg' }) {
  return (
    <div className={`wordmark wordmark-${size}`}>
      <svg className="wordmark-mark" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="wm-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8cc8ff" />
            <stop offset="1" stopColor="#e6c27a" />
          </linearGradient>
        </defs>
        <circle className="wm-ring wm-ring-3" cx="32" cy="32" r="28" />
        <circle className="wm-ring wm-ring-2" cx="32" cy="32" r="19" />
        <circle className="wm-core" cx="32" cy="32" r="9" />
      </svg>
      <div>
        <h1 className="wordmark-title">Breathe <em>with me</em></h1>
        {size === 'lg' && <p className="wordmark-tag">A calm minute, guided by Bree.</p>}
      </div>
    </div>
  );
}
