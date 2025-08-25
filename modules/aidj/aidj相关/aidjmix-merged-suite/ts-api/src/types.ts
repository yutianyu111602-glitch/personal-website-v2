export type CamelotKey = `${number}A` | `${number}B`;
export interface TrackFeature {
  id: string; title?: string; artist?: string;
  durationSec: number; bpm: number; keyCamelot: CamelotKey;
  energyCurve?: number[]; downbeats?: number[];
  cueInSec?: number; cueOutSec?: number; vocality?: number;
  tags?: string[]; path: string;
}
export interface PlaylistItem {
  track: TrackFeature; startAt?: number; endAt?: number;
  stretchPct?: number; transposeSemitone?: number;
  crossfadeBeats?: number; automation?: any[];
}
export interface TransitionPlan { items: PlaylistItem[]; totalSec: number; avgScore: number; }
