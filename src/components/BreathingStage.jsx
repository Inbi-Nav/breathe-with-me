import CameraPreview from './CameraPreview';

export default function BreathingStage({ stream, level, hasSignal }) {
  return (
    <div
      className={`stage ${hasSignal ? 'stage-live' : ''}`}
      style={{ '--b': Number(level).toFixed(3) }}
      role="img"
      aria-label={hasSignal
        ? 'Circles around your camera view follow your breathing'
        : 'Camera view. The circles will follow your breathing once it is found'}
    >
      <i className="stage-ring stage-ring-3" />
      <i className="stage-ring stage-ring-2" />
      <i className="stage-ring stage-ring-1" />
      <div className="stage-window">
        {stream ? <CameraPreview stream={stream} /> : <p>Opening camera…</p>}
      </div>
    </div>
  );
}
