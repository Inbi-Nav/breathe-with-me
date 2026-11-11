
'use strict';

const {SmartSpectraSDK, breathingMetrics, cardioMetrics} = require('@smartspectra/node-sdk/renderer');
const {decodeMetrics} = require('@smartspectra/node-sdk/messages');
const keyInput = document.getElementById('api-key');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const statusText = document.getElementById('status');
const validationText = document.getElementById('validation');
const preview = document.getElementById('preview');
const breathingText = document.getElementById('breathing');
const pulseText = document.getElementById('pulse');

let sdk = null;
let isBusy = false;

function latestValue(measurements) {
    if (!measurements?.length) return null;
    return measurements[measurements.length - 1].value;
}

async function startSession() {
        if (sdk || isBusy) return;
        const apiKey = keyInput.value.trim();
        if (!apiKey) {
        statusText.textContent = 'Please enter your API key';
        return;
        }
        isBusy = true;
        startButton.disabled = true;
        stopButton.disabled = false;
        statusText.textContent = 'Starting camera...';
        validationText.textContent = 'Calibrating...';
        breathingText.textContent = '—';
        pulseText.textContent = '—';

        try {
            sdk = new SmartSpectraSDK({apiKey, requestedMetrics: [ ...breathingMetrics, ...cardioMetrics ],
        enableTelemetry: false,
        enableAccumulatedOutput: false
        });

        sdk.on('streamAvailable', async (stream) => {
        preview.srcObject = stream;
            try {
            await preview.play();
            } catch (error) {
                console.warn('Preview playback:', error);
            }
        });

    sdk.on('validationStatus', (code, timestamp, hint) => {
        validationText.textContent =
        hint || `Measurement status: ${code}`;
    });

    sdk.on('metrics', (buffer) => {
        try {
        const metrics = decodeMetrics(buffer);
        const breathing = latestValue( metrics.breathing?.rate);
        const pulse = latestValue(metrics.cardio?.pulseRate);
        if (Number.isFinite(breathing)) {
            breathingText.textContent = breathing.toFixed(0);
        }
        if (Number.isFinite(pulse)) {
            pulseText.textContent = pulse.toFixed(0);
        }

        } catch (error) {
        console.error('Metrics decoding failed:', error);
        }
    });

    sdk.on('error', (code, message) => {
        console.error('SmartSpectra error:', code, message);
        statusText.textContent = `SDK error: ${message}`;
    });

    await sdk.start();
    statusText.textContent = 'Measurement running';
    keyInput.value = '';

    } catch (error) {
        console.error('Failed to start:', error);
        statusText.textContent =`Failed to start: ${error.message}`;
        await stopSession();
    } finally {
        isBusy = false;
    }
}

async function stopSession() {
    if (!sdk) {
        preview.srcObject = null;
        startButton.disabled = false;
        stopButton.disabled = true;
        return;
    }
    stopButton.disabled = true;
    statusText.textContent = 'Stopping...';
    const currentSdk = sdk;
    sdk = null;

    try {
        await currentSdk.stop();
    } catch (error) {
        console.error('Stop failed:', error);
    } finally {
    try {
        currentSdk.destroy();
    } catch (error) {
        console.warn('Destroy failed:', error);
    }
    preview.srcObject = null;
    startButton.disabled = false;
    stopButton.disabled = true;
    statusText.textContent = 'Camera stopped';
    validationText.textContent = 'Session ended';
  }
}

startButton.addEventListener('click', startSession);
stopButton.addEventListener('click', stopSession);

window.addEventListener('beforeunload', () => {
  if (sdk) {
    try {
        sdk.destroy();
    } catch (error) {
        console.warn('Cleanup failed:', error);
    }
  }
});