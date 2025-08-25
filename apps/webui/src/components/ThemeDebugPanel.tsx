import React, { useEffect, useState } from 'react';
import { UnifiedEventBus, onMood } from './events/UnifiedEventBus';

type ThemeTokens = {
  accent: string;
  background: string;
  intensity: number;
  motion: number;
  contrast: number;
};

export const ThemeDebugPanel: React.FC = () => {
  const [theme, setTheme] = useState<ThemeTokens | null>(null);
  const [mood, setMood] = useState<{ energy: number; valence: number; arousal: number } | null>(null);

  useEffect(() => {
    const unsubA = UnifiedEventBus.on('global', 'config', (e) => {
      if (e.data?.theme) setTheme(e.data.theme);
    });
    const unsubB = onMood((e) => setMood(e.data?.mood));
    return () => {
      unsubA();
      unsubB();
    };
  }, []);

  const emitTestMood = () => {
    UnifiedEventBus.emitMood({ energy: Math.random(), valence: Math.random() * 2 - 1, arousal: Math.random() });
  };

  if (!theme) return null;

  return (
    <div style={{
      position: 'fixed',
      left: 8,
      bottom: 84,
      zIndex: 210,
      fontFamily: 'monospace',
      background: 'rgba(0,0,0,0.35)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 6,
      padding: '6px 8px',
      color: 'rgba(220,220,220,0.9)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: 9999, background: theme.accent }} />
        <div>Theme</div>
        <button onClick={emitTestMood} style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, background: 'transparent', color: 'rgba(220,220,220,0.85)' }}>Test Mood</button>
      </div>
      <div style={{ fontSize: 11, marginTop: 4 }}>accent: {theme.accent}</div>
      <div style={{ fontSize: 11 }}>intensity: {theme.intensity.toFixed(2)}</div>
      <div style={{ fontSize: 11 }}>motion: {theme.motion.toFixed(2)}</div>
      <div style={{ fontSize: 11 }}>contrast: {theme.contrast.toFixed(2)}</div>
      {mood && (
        <div style={{ fontSize: 11, marginTop: 4 }}>mood: E {mood.energy.toFixed(2)} V {mood.valence.toFixed(2)} A {mood.arousal.toFixed(2)}</div>
      )}
    </div>
  );
};

export default ThemeDebugPanel;


