import { useCallback, useEffect, useRef, useState } from 'react';
import { createSmartSpectraSession } from '../services/smartSpectra';
import { analyzeSession } from '../lib/sessionAnalysis';

export function useSmartSpectra() {
  const sdkRef = useRef(null);
  const startPromiseRef = useRef(null);
  const stopPromiseRef = useRef(null);
  const cancelRef = useRef(false);
  const mountedRef = useRef(true);
  const startedAtRef = useRef(null);
  const samplesRef = useRef([]);

  const [status, setStatus] = useState('idle');
  const [hint, setHint] = useState('');
  const [breathingRate, setBreathingRate] = useState(null);
  const [pulseRate, setPulseRate] = useState(null);
  const [breathingTrace, setBreathingTrace] = useState([]);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [authFailed, setAuthFailed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const stopSession = useCallback(async () => {
    if (stopPromiseRef.current) return stopPromiseRef.current;

    const sdk = sdkRef.current;
    if (!sdk) return null;
    cancelRef.current = true;

    if (mountedRef.current) setStatus('stopping');

    const cleanup = (async () => {
      let result = null;

      try {
        await startPromiseRef.current;
      } catch {

      }

      try {
        await sdk.stop();
      } catch (err) {
        console.warn('SmartSpectra stop:', err);
      } finally {
        try {
          await sdk.destroy();
        } catch (err) {
          console.warn('SmartSpectra destroy:', err);
        }

        if (sdkRef.current === sdk) sdkRef.current = null;

        if (startedAtRef.current !== null) {
          result = analyzeSession(samplesRef.current, startedAtRef.current, Date.now());
        }

        if (mountedRef.current) {
          setStream(null);
          setBreathingRate(null);
          setPulseRate(null);
          setBreathingTrace([]);
          setHint('');
          setStatus('idle');
        }
        startedAtRef.current = null;
        samplesRef.current = [];
      }

      return result;
    })();

    stopPromiseRef.current = cleanup;

    try {
      return await cleanup;
    } finally {
      if (stopPromiseRef.current === cleanup) stopPromiseRef.current = null;
    }
  }, []);

  const startSession = useCallback(async (apiKey) => {
    if (sdkRef.current || stopPromiseRef.current) return 'failed';

    if (!apiKey?.trim()) {
      setError('Please enter your Presage API key.');
      return 'failed';
    }

    cancelRef.current = false;
    setError('');
    setAuthFailed(false);
    setHint('');
    setBreathingRate(null);
    setPulseRate(null);
    setBreathingTrace([]);
    setElapsedSeconds(0);
    setStream(null);
    setStatus('starting');

    samplesRef.current = [];
    startedAtRef.current = null;

    let sdk;

    try {
      sdk = createSmartSpectraSession(apiKey.trim(), {
        onStream: (cameraStream) => {
          if (!cancelRef.current && mountedRef.current) setStream(cameraStream);
        },

        onValidation: ({ ok, hint: message }) => {
          if (!cancelRef.current && mountedRef.current) setHint(ok ? '' : message);
        },

        onMetrics: (data) => {
          if (cancelRef.current || !mountedRef.current) return;

          const { breathingRate: br, pulseRate: pr, breathingTrace: trace } = data;

          if (Number.isFinite(br)) setBreathingRate(br);
          if (Number.isFinite(pr)) setPulseRate(pr);
          if (trace?.length) setBreathingTrace(trace);

          if (startedAtRef.current !== null && (Number.isFinite(br) || Number.isFinite(pr))) {
            samplesRef.current.push({ time: Date.now(), breathingRate: br, pulseRate: pr });
          }
        },

        onError: (err) => {
          if (!cancelRef.current && mountedRef.current) {
            setError(err.message || 'SmartSpectra error.');
            setAuthFailed(Boolean(err.isAuthError));
            setStatus('error');
          }
        }
      });

      sdkRef.current = sdk;

      const pendingStart = Promise.resolve().then(() => sdk.start());
      startPromiseRef.current = pendingStart;
      await pendingStart;

      if (cancelRef.current || !mountedRef.current) return 'cancelled';

      startedAtRef.current = Date.now();
      setStatus('running');
      return 'ok';
    } catch (err) {
      const cancelled = cancelRef.current;
      if (!cancelled && mountedRef.current) {
        setError(err.message || 'Could not start the session.');
        setAuthFailed(Boolean(err.isAuthError));
      }
      if (sdk && !cancelled) await stopSession();
      return cancelled ? 'cancelled' : 'failed';
    } finally {
      startPromiseRef.current = null;
    }
  }, [stopSession]);

  useEffect(() => {
    if (status !== 'running') return;

    const update = () => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      cancelRef.current = true;

      const sdk = sdkRef.current;
      sdkRef.current = null;

      if (sdk && !stopPromiseRef.current) {
        Promise.resolve(startPromiseRef.current)
          .catch(() => {})
          .then(() => sdk.stop())
          .catch(() => {})
          .then(() => sdk.destroy())
          .catch((err) => console.warn('SDK cleanup:', err));
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError('');
    setAuthFailed(false);
  }, []);

  return {
    status, hint, breathingRate, pulseRate, breathingTrace, stream,
    error, authFailed, elapsedSeconds,
    startSession, stopSession, clearError
  };
}
