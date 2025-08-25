export type TransitionAction = 'next' | 'prev' | 'crossfade';

export interface RouterAdapterConfig {
  ENDPOINT_NEXT: string;        // e.g. '/api/music/next'
  ENDPOINT_PREV: string;        // e.g. '/api/music/previous'
  ENDPOINT_CROSSF?: string;     // e.g. '/api/music/crossfade?duration={ms}'
  ENDPOINT_VOLUME?: string;     // e.g. '/api/music/volume?level={v}'
  DEFAULT_CROSSFADE_MS?: number; // default 4000
  SAFETY_RATE_LIMIT_MS?: number; // default 1200
}

export interface TransitionEventPayload {
  action: TransitionAction;
  durationMs?: number;
  fromTrack?: string;
  toTrack?: string;
  reason?: string;
}

export interface VolumeEventPayload { level: number; } // 0..1

export interface NowPlaying {
  title?: string;
  artist?: string;
  bpm?: number;
  keyCamelot?: string;
  trackId?: string | number;
  segment?: 'steady'|'build'|'fill'|'drop'|'break';
}
