// rotation/ts/presetScheduler.ts
// Logic-only preset rotation (no ports, no servers).
// Choose a Techno preset by local time + (optional) telemetry, return flags for simpleHeadTail.
// Safe to import from any frontend/worker code without altering your Managers.

export type PresetName = 'deep_minimal' | 'classic' | 'peak_warehouse' | 'hard_techno' | 'hypnotic';

export interface RotationSlot {
  startHour: number;   // inclusive, 0..23 (local time)
  endHour: number;     // exclusive, 1..24 (local time)
  preset: PresetName;
  simpleHeadTail?: boolean; // true: only head-tail connections (no extra automation hints)
  notes?: string;
}

export interface Telemetry {
  // Optional realtime signals to bias selection (all optional)
  listeners?: number;        // concurrent listeners
  dropoutRate?: number;      // 0..1 (higher => simplify transitions)
  recentErrors?: number;     // number of failures in last window
  avgBpm?: number;           // current average BPM of nowplaying
}

export interface Selection {
  preset: PresetName;
  simpleHeadTail: boolean;
  reason: string[];
}

export const DEFAULT_ROTATION: RotationSlot[] = [
  { startHour: 0,  endHour: 6,  preset: 'deep_minimal',  simpleHeadTail: true,  notes: 'late night low-key flow' },
  { startHour: 6,  endHour: 12, preset: 'classic',       simpleHeadTail: false, notes: 'daytime baseline' },
  { startHour: 12, endHour: 18, preset: 'peak_warehouse',simpleHeadTail: false, notes: 'afternoon energy' },
  { startHour: 18, endHour: 22, preset: 'peak_warehouse',simpleHeadTail: false, notes: 'prime time push' },
  { startHour: 22, endHour: 24, preset: 'hypnotic',      simpleHeadTail: true,  notes: 'late evening long layers' },
];

function inRange(h: number, s: RotationSlot): boolean {
  if (s.startHour < s.endHour) return h >= s.startHour && h < s.endHour;
  // overnight wrap (not used in default but kept generic)
  return h >= s.startHour || h < s.endHour;
}

export function selectPreset(localDate: Date, rotation: RotationSlot[] = DEFAULT_ROTATION, telemetry?: Telemetry): Selection {
  const h = localDate.getHours();
  const slot = rotation.find(s => inRange(h, s)) ?? rotation[0];
  const reason: string[] = [`time:${h}:00 in [${slot.startHour},${slot.endHour}) → ${slot.preset}`];
  let simple = !!slot.simpleHeadTail;

  // Stability guardrails
  if (telemetry?.recentErrors && telemetry.recentErrors > 0) {
    simple = true; reason.push('recentErrors>0 → force simpleHeadTail');
  }
  if (typeof telemetry?.dropoutRate === 'number' && telemetry.dropoutRate > 0.05) {
    simple = true; reason.push('dropoutRate>5% → simplify transitions');
  }
  if (typeof telemetry?.avgBpm === 'number') {
    // If avg BPM > 132 and preset is mellow, bias to peak_warehouse
    if (telemetry.avgBpm >= 132 && (slot.preset === 'deep_minimal' || slot.preset === 'classic' || slot.preset === 'hypnotic')) {
      reason.push(`avgBpm=${telemetry.avgBpm} → bias up`);
      return { preset: 'peak_warehouse', simpleHeadTail: simple, reason };
    }
    // If avg BPM < 126 and preset is aggressive, relax
    if (telemetry.avgBpm <= 126 && (slot.preset === 'peak_warehouse' || slot.preset === 'hard_techno')) {
      reason.push(`avgBpm=${telemetry.avgBpm} → bias down`);
      return { preset: 'classic', simpleHeadTail: simple, reason };
    }
  }
  return { preset: slot.preset, simpleHeadTail: simple, reason };
}

// Optional helper: compute next change time (minutes until next slot)
export function minutesUntilNextChange(localDate: Date, rotation: RotationSlot[] = DEFAULT_ROTATION): number {
  const h = localDate.getHours();
  const m = localDate.getMinutes();
  const cur = rotation.find(s => inRange(h, s)) ?? rotation[0];
  const endH = cur.endHour % 24;
  const minutesToEnd = ((endH - h + 24) % 24) * 60 - m;
  return minutesToEnd <= 0 ? 60 : minutesToEnd;
}

// Usage (no port):
// const sel = selectPreset(new Date(), DEFAULT_ROTATION, { listeners, dropoutRate, recentErrors, avgBpm });
// client.requestAutoPlaylist(tracks, 60, 24, /* body can include */ sel);
