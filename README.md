# Breathe With Me

### Your breathing, visualized. Your moments, made meaningful.

**A camera-powered desktop wellness experience built with Presage SmartSpectra SDK.**

Breathe With Me turns live breathing signals into a gentle interactive experience, with a friendly companion named **Bree**, a personal dashboard, and simple reflections after each session.

## About the project

Breathe With Me was created for the **[Presage SmartSpectra SDK Challenge](https://dev.to/challenges/presage-2026-11-04)** on DEV (November 4–22, 2026). The goal is to make real-time camera-based human sensing approachable and pleasant to use.


The main integration files are:

```text
breathe-with-me/
├── electron/
│   ├── main.js                 # Electron window, camera permission and IPC
│   ├── config.js               # Reads local .env configuration
│   ├── preload.js              # Bridge for optional desktop helpers
│   ├── insights.js             # Optional Ollama-generated reflection
│   └── tts.js                  # Optional ElevenLabs speech
├── src/
│   ├── components/             # Dashboard, guide, live view, charts, summary
│   ├── hooks/                  # SmartSpectra and UI behavior
│   ├── services/smartSpectra.js # SmartSpectra SDK setup and events
│   ├── lib/                    # Session analysis, suggestions, export, storage
│   ├── App.jsx                 # Screen navigation and session lifecycle
│   └── App.css                 # Application styling
├── .env.example                # Configuration template (safe to commit)
├── index.html                  # Vite entry HTML
└── package.json
```

# Features

| Feature | What it does |
| --- | --- |
| **Live camera-based measurements** | Reads breathing rate, pulse rate, and a breathing waveform using the official SmartSpectra SDK. |
| **Breathing visualization** | An animated visual responds to live breathing-waveform data when available. |
| **Bree, your friendly guide** | Offers simple instructions and encouragement during the experience and at the end. |
| **Camera consent** | Requires an explicit action before beginning a session. |
| **Measurement feedback** | Shows guidance from SDK validation events, including positioning or lighting hints. |
| **Session summary** | Displays breathing trends, average readings, a first/last-minute comparison (when enough data exists), and derived rhythm observations. |
| **Daily wellness ideas** | Offers gentle movement, breathing, rest, and habit suggestions without claiming medical benefits. |
| **Personal dashboard** | Displays previous sessions, trends, goals, and activity statistics when saving is enabled. |
| **CSV export** | Exports session results on request. |
| **Optional AI insights** | Can generate a friendly written reflection using Ollama. Built-in suggestions are always available as a fallback. |
| **Optional voice** | Uses available system voices, or ElevenLabs if configured; voice playback can be switched off. |

## Tech stack

- **Desktop:** Electron
- **Frontend:** React, JavaScript/JSX, CSS
- **Build tool:** Vite
- **Human sensing:** [`@smartspectra/node-sdk`](https://github.com/Presage-Security/SmartSpectra)
- **Optional AI reflections:** Ollama (local server or configured hosted endpoint)
- **Optional voice:** ElevenLabs (fallback to installed system voices)
- **Storage:** Browser `localStorage` for opted-in session history and UI preferences; optional generated voice audio is cached in Electron's application-data directory

## Getting started

### Requirements

- **Node.js** and **npm** 
- A working webcam
- A **Presage developer API key** 

### 1. Clone the repository

```bash
git clone https://github.com/Inbi-Nav/breathe-with-me.git
cd breathe-with-me
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your Presage key (recommended)

Copy the example file to `.env`:

Open `.env` and set:

```dotenv
PRESAGE_API_KEY=your_presage_api_key_here
```

You can leave the optional AI and voice settings blank. If no `PRESAGE_API_KEY` is configured, the app prompts for the key when you begin a session.

### 4. Launch the desktop app

```bash
npm start
```

## What the summary means

After a session, the app can display:

- **Average pulse and breathing rate** from available measurements
- **Breathing trend** across the session
- **First versus last minute** when a session is at least two minutes long and enough readings exist in both windows
- **Rhythm steadiness / coherence** calculated by the app from breathing-rate variation across 30-second windows
- **Session-phase distribution**, based on the app's own breathing-rate ranges
- **Bree's practical suggestions** for everyday wellness