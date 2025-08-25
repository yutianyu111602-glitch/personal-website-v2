// 情绪状态（Zustand）
import { create } from 'zustand';

export type Mood = { energy: number; valence: number; arousal: number };
type PartialMood = Partial<Mood>;

type MoodStore = {
  user: PartialMood;
  schedule: PartialMood;
  tod: PartialMood;
  auto: PartialMood;
  setUser: (m: PartialMood) => void;
  setSchedule: (m: PartialMood) => void;
  setToD: (m: PartialMood) => void;
  setAuto: (m: PartialMood) => void;
  effective: () => Mood;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const useMoodStore = create<MoodStore>((set, get) => ({
  user: {},
  schedule: {},
  tod: {},
  auto: {},
  setUser: (m) => set({ user: { ...get().user, ...m } }),
  setSchedule: (m) => set({ schedule: { ...get().schedule, ...m } }),
  setToD: (m) => set({ tod: { ...get().tod, ...m } }),
  setAuto: (m) => set({ auto: { ...get().auto, ...m } }),
  effective: () => {
    const def: Mood = { energy: 0.6, valence: 0.0, arousal: 0.5 };
    const srcs = [def, get().auto, get().tod, get().schedule, get().user];
    const merged = srcs.reduce((acc, cur) => ({
      energy: cur.energy ?? acc.energy,
      valence: cur.valence ?? acc.valence,
      arousal: cur.arousal ?? acc.arousal,
    })) as Mood;
    const prev: Mood | undefined = (window as any).__moodPrev;
    const a = 0.15;
    const smoothed: Mood = prev
      ? {
          energy: prev.energy * (1 - a) + merged.energy * a,
          valence: prev.valence * (1 - a) + merged.valence * a,
          arousal: prev.arousal * (1 - a) + merged.arousal * a,
        }
      : merged;
    (window as any).__moodPrev = smoothed;
    smoothed.energy = clamp(smoothed.energy, 0, 1);
    smoothed.valence = clamp(smoothed.valence, -1, 1);
    smoothed.arousal = clamp(smoothed.arousal, 0, 1);
    return smoothed;
  },
}));


