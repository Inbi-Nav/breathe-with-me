
import { useCallback, useEffect, useRef, useState } from 'react';
import { createSmartSpectraSession } from '../services/smartSpectra';

export function useSmartSpectra() {
    const sdkRef = useRef(null);
    const startPromiseRef = useRef(null);
    const cancelRef = useRef(false);
    const mountedRef = useRef(true);

    const [status, setStatus] = useState('idle');
    const [hint, setHint] = useState('');
    const [breathingRate, setBreathingRate] = useState(null);
    const [pulseRate, setPulseRate] = useState(null);
    const [breathingTrace, setBreathingTrace] = useState([]);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');

    const stopSession = useCallback(async () => {

        const sdk = sdkRef.current;
        
        if (!sdk) return;
        cancelRef.current = true;
        
        setStatus('stopping');
        try {
            await startPromiseRef.current;
        } catch {

        }

        try {
            await sdk.stop();
        } catch (err) {
            console.warn('SDK stop:', err);
        } finally {
            sdk.destroy();
            if (sdkRef.current === sdk) {
            sdkRef.current = null;
            }
            if (mountedRef.current) {
            setStream(null);
            setBreathingTrace([]);
            setHint('');
            setStatus('idle');
            }
        }}, []);

        const startSession = useCallback(async (apiKey) => {
            if (sdkRef.current) return;
            if (!apiKey?.trim()) {
                setError('Please enter your Presage API key.');
                return;
            }
            cancelRef.current = false;
            setError('');
            setHint('Finding a clear signal...');
            setBreathingRate(null);
            setPulseRate(null);
            setBreathingTrace([]);
            setStatus('starting');
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

                if (data.breathingRate !== null) {
                    setBreathingRate(data.breathingRate);
                }

                if (data.pulseRate !== null) {
                    setPulseRate(data.pulseRate);
                }

                if (data.breathingTrace.length) {
                    setBreathingTrace(data.breathingTrace);
                }
            },

            onError: (err) => {
                if (!cancelRef.current && mountedRef.current) {
                    setError(err.message);
                    setStatus('error');
                }
            }});

            sdkRef.current = sdk;

            const startPromise = sdk.start();
            startPromiseRef.current = startPromise;
            await startPromise;
            if (!cancelRef.current && mountedRef.current) {
                setStatus('running');
            }
            } catch (err) {
        
            if (mountedRef.current && !cancelRef.current) {
                setError(err.message || 'Could not start the session.');
                setStatus('error');
            }

            if (sdk && !cancelRef.current) {
                await stopSession();
            }
            } finally {
            startPromiseRef.current = null;
            }
        }, [stopSession]);

        useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            cancelRef.current = true;
            const sdk = sdkRef.current;
            sdkRef.current = null;
            if (sdk) {
            Promise.resolve(startPromiseRef.current)
              .catch(() => {})
              .then(() => sdk.stop())
              .catch(() => {})
              .finally(() => sdk.destroy());
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
        startSession,
        stopSession
    };
}
