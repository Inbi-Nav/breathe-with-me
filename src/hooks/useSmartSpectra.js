
import {useCallback, useEffect, useRef, useState} from 'react';

import {createSmartSpectraSession} from '../services/smartSpectra';

const MIN_SESSION_SECONDS = 120;
const WINDOW_MS = 60_000;
const MIN_SAMPLES = 3;

function average(values) {  
    if (values.length < MIN_SAMPLES) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summarizeSession(samples, startedAt, endedAt) {

    const duration = Math.floor((endedAt - startedAt) / 1000);
    if (duration < MIN_SESSION_SECONDS) {
      return { duration, available: false, message: 'Complete at least 2 minutes to compare your measurements.'};
    }

    const first = samples.filter(
        (sample) => sample.time >= startedAt && sample.time < startedAt + WINDOW_MS
    );

    const last = samples.filter(
        (sample) => sample.time > endedAt - WINDOW_MS && sample.time <= endedAt
    );

    const getAverage = (items, field) =>
        average( items .map((item) => item[field]).filter(Number.isFinite)
    );

    const result = {
        duration,
        firstPulse: getAverage(first, 'pulseRate'),
        lastPulse: getAverage(last, 'pulseRate'),
        firstBreathing: getAverage(first, 'breathingRate'),
        lastBreathing: getAverage(last, 'breathingRate')
    };

    console.table({
      firstMinute: {
        total: first.length,
        pulse: first.filter(s => Number.isFinite(s.pulseRate)).length,
        breathing: first.filter(s => Number.isFinite(s.breathingRate)).length
      },
      lastMinute: {
        total: last.length,
        pulse: last.filter(s => Number.isFinite(s.pulseRate)).length,
        breathing: last.filter(s => Number.isFinite(s.breathingRate)).length
      }
    });
    console.log('Session summary:', result);


    return {
        ...result,
        available: [
            result.firstPulse,
            result.lastPulse,
            result.firstBreathing,
            result.lastBreathing
        ].every(Number.isFinite), message: 'Some measurements were unavailable during this session.'
    };
}

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
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [summary, setSummary] = useState(null);
    const stopSession = useCallback(async () => {
    if (stopPromiseRef.current) {
        return stopPromiseRef.current;
    }

    const sdk = sdkRef.current;

    if (!sdk) return;
    cancelRef.current = true;

    if (mountedRef.current) {
        setStatus('stopping');
    }

    const cleanup = (async () => {
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

            if (sdkRef.current === sdk) {
                sdkRef.current = null;
            }

            if (mountedRef.current) {
                if (startedAtRef.current !== null) {
                    setSummary(
                        summarizeSession(
                            samplesRef.current,
                            startedAtRef.current,
                            Date.now()
                        )
                    );
                }

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
    })();

    stopPromiseRef.current = cleanup;

    try {
        await cleanup;
    } finally {
        if (stopPromiseRef.current === cleanup) {
            stopPromiseRef.current = null;
        }
    }
    }, []);

  const startSession = useCallback(async (apiKey) => {
    if (sdkRef.current || stopPromiseRef.current) return;

    if (!apiKey?.trim()) {
      setError('Please enter your Presage API key.');
      return;
    }

    cancelRef.current = false;
    setError('');
    setSummary(null);
    setHint('Finding a clear signal...');
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
          if (!cancelRef.current && mountedRef.current) {
            setStream(cameraStream);
          }
        },

        onValidation: (message) => {
          if (!cancelRef.current && mountedRef.current) {
            setHint(message);
          }
        },

        onMetrics: (data) => {
          if (cancelRef.current || !mountedRef.current) return;

          const { breathingRate, pulseRate, breathingTrace } = data;

          if (Number.isFinite(breathingRate)) {
            setBreathingRate(breathingRate);
          }

          if (Number.isFinite(pulseRate)) {
            setPulseRate(pulseRate);
          }

          if (breathingTrace?.length) {
            setBreathingTrace(breathingTrace);
          }

          if (startedAtRef.current !== null &&
              (Number.isFinite(breathingRate) ||
               Number.isFinite(pulseRate))) {
            samplesRef.current.push({
              time: Date.now(),
              breathingRate,
              pulseRate
            });
          }
        },

        onError: (err) => {
          if (!cancelRef.current && mountedRef.current) {
            setError(err.message || 'SmartSpectra error.');
            setStatus('error');
          }
        }
      });

      sdkRef.current = sdk;

      // Timestamp for this measurement session.
      startedAtRef.current = Date.now();

      const pendingStart = Promise.resolve().then(
        () => sdk.start()
      );

      startPromiseRef.current = pendingStart;

      await pendingStart;

      if (!cancelRef.current && mountedRef.current) {
        setStatus('running');
      }
    } catch (err) {
      if (!cancelRef.current && mountedRef.current) {
        setError(err.message || 'Could not start the session.');
      }

      if (sdk && !cancelRef.current) {
        await stopSession();
      }
    } finally {
      startPromiseRef.current = null;
    }
  }, [stopSession]);

  // Update the elapsed time while a session is running.
  useEffect(() => {
    if (status !== 'running') return;

    const updateTimer = () => {
      if (startedAtRef.current !== null) {
        setElapsedSeconds(
          Math.floor(
            (Date.now() - startedAtRef.current) / 1000
          )
        );
      }
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Cleanup when leaving the React application.
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
          .catch((err) =>
            console.warn('SDK cleanup:', err)
          );
        }
    };
  }, []);

    return {
    status,
    hint,
    breathingRate,
    pulseRate,
    breathingTrace,
    stream,
    error,
    elapsedSeconds,
    summary,
    startSession,
    stopSession
  };
}