import { useEffect, useState } from 'react';

export function useConfig() {
  const [config, setConfig] = useState({ loaded: false, presageKey: '', aiEnabled: false, aiModel: null, ttsEnabled: false });

  useEffect(() => {
    let cancelled = false;
    const read = window.bwm?.getConfig?.() ?? Promise.resolve(null);
    read
      .then((value) => {
        if (!cancelled) setConfig({ loaded: true, presageKey: '', aiEnabled: false, aiModel: null, ttsEnabled: false, ...(value ?? {}) });
      })
      .catch(() => {
        if (!cancelled) setConfig((c) => ({ ...c, loaded: true }));
      });
    return () => { cancelled = true; };
  }, []);

  return config;
}
