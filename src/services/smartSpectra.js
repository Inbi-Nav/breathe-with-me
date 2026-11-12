import {SmartSpectraSDK, breathingMetrics, cardioMetrics} from '@smartspectra/node-sdk/renderer';
import { decodeMetrics } from '@smartspectra/node-sdk/messages';

function latestValue(samples) {
    if (!samples?.length) return null;
    const value = samples[samples.length - 1]?.value;
    return Number.isFinite(value) ? value : null;
}

export function createSmartSpectraSession(apiKey, callbacks) {
    const sdk = new SmartSpectraSDK({ 
        apiKey, requestedMetrics: [ 
            ...breathingMetrics, 
            ...cardioMetrics
        ],
        enableTelemetry: false,
        enableAccumulatedOutput: false
    });

    sdk.on('streamAvailable', (stream) => { 
        callbacks.onStream?.(stream); 
    });

    sdk.on('validationStatus', (code, timestamp, hint) => {
        callbacks.onValidation?.(hint || 'Adjust your position or lighting');
    });

    sdk.on('metrics', (buffer) => {
        try {
            const metrics = decodeMetrics(buffer);
            callbacks.onMetrics?.({
                breathingRate: latestValue(metrics.breathing?.rate),
                pulseRate: latestValue(metrics.cardio?.pulseRate),
                breathingTrace: metrics.breathing?.upperTrace ?? []
            });
        } catch (error) {
          callbacks.onError?.(error);
        }
    });

    sdk.on('error', (code, message) => {
        callbacks.onError?.( new Error(message || `SmartSpectra error ${code}`));
    });
    return sdk;
}