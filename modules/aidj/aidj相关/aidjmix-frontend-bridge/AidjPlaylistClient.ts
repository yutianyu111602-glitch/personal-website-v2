/** AidjPlaylistClient - 前端桥接：请求自动歌单并通过 UnifiedEventBus 广播 */
import { UnifiedEventBus } from '../components/events/UnifiedEventBus';
export type TrackFeature = { id: string; durationSec: number; bpm: number; keyCamelot: string;
  energyCurve?: number[]; downbeats?: number[]; cueInSec?: number; cueOutSec?: number; vocality?: number;
  title?: string; artist?: string; path: string; };
export class AidjPlaylistClient {
  constructor(private endpoint = '/api/aidjmix/autoplaylist') {}
  async requestAutoPlaylist(tracks: TrackFeature[], minutes=60, beamWidth=24): Promise<void> {
    const ctrl = new AbortController(); const to = setTimeout(()=>ctrl.abort(), 30_000);
    try {
      const res = await fetch(this.endpoint, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tracks, minutes, beamWidth, techno: true }), signal: ctrl.signal });
      if (!res.ok) throw new Error('autoplaylist http error'); const data = await res.json();
      UnifiedEventBus.emit({ namespace:'automix', type:'plan', timestamp: Date.now(), data });
      UnifiedEventBus.emit({ namespace:'automix', type:'m3u', timestamp: Date.now(), data: { m3u: data.m3u } });
    } catch (e) {
      UnifiedEventBus.emit({ namespace:'automix', type:'error', timestamp: Date.now(), data: { message: String(e) } });
    } finally { clearTimeout(to); }
  }
}
