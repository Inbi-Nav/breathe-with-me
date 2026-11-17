import { useEffect, useRef } from 'react';

export default function CameraPreview({ stream, label = 'Live camera preview' }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    video.srcObject = stream;
    if (stream) {
      video.play().catch((err) => console.warn('Camera preview:', err));
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return <video ref={ref} className="camera-video" autoPlay muted playsInline aria-label={label} />;
}
