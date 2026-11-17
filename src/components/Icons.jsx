const base = {
  width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  'aria-hidden': true
};

export const CalendarIcon = () => (
  <svg {...base}><rect x="3.5" y="5" width="17" height="15" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
export const DownloadIcon = () => (
  <svg {...base}><path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14" /></svg>
);
export const CheckIcon = () => (
  <svg {...base}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const CameraIcon = () => (
  <svg {...base} width="26" height="26"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.2" /></svg>
);
export const ArrowLeftIcon = () => (
  <svg {...base}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);

export const WalkIcon = () => (
  <svg {...base}><circle cx="13.5" cy="4.5" r="1.8" /><path d="M9.5 21l2-6-2.2-2.5 1.6-4.4 3.5 1.8 2.4 2.6M11.5 15l3 2.4.8 3.6M10.9 8.4 8.2 10.7" /></svg>
);
export const WindIcon = () => (
  <svg {...base}><path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" /></svg>
);
export const SunIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>
);
export const HeartIcon = () => (
  <svg {...base}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
);
export const SpeakerIcon = () => (
  <svg {...base} width="16" height="16"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></svg>
);
export const SpeakerOffIcon = () => (
  <svg {...base} width="16" height="16"><path d="M4 9.5v5h3.5l4.5 4v-13l-4.5 4z" /><path d="m16 9.5 5 5M21 9.5l-5 5" /></svg>
);
export const TrashIcon = () => (
  <svg {...base} width="16" height="16"><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v5M14 11v5" /></svg>
);
export const SparkIcon = () => (
  <svg {...base}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>
);

export const CARD_ICONS = { walk: WalkIcon, wind: WindIcon, sun: SunIcon, heart: HeartIcon };
