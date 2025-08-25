// 自动歌单请求客户端（逻辑优先，UI 反馈交给总线 + Cursor）
import { EventBus } from '../console/EventBusAdapter';
import type { PresetName, TechniqueName, TrackFeature } from '../types/shared';

export interface RequestOptions { minutes?:number; beamWidth?:number; preset?:PresetName; simpleHeadTail?:boolean; technique?:TechniqueName; }

export class AidjPlaylistClient {
  constructor(private endpoint='/api/aidjmix/autoplaylist') {}
  async requestAutoPlaylist(tracks: TrackFeature[], options: RequestOptions = {}){
    const { minutes=60, beamWidth=24, preset='classic', simpleHeadTail=false, technique } = options;
    // 立即乐观反馈（AI 正在工作）：
    EventBus.emit({ namespace:'automix', type:'request', timestamp:Date.now(), data:{ minutes, beamWidth, preset, simpleHeadTail, technique } });
    const ctrl = new AbortController(); const to = setTimeout(()=>ctrl.abort(), 25_000);
    try{
      const res = await fetch(this.endpoint, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tracks, minutes, beamWidth, preset, simpleHeadTail, technique }), signal: ctrl.signal });
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      EventBus.emit({ namespace:'automix', type:'plan', timestamp: Date.now(), data });
    }catch(e:any){
      EventBus.emit({ namespace:'automix', type:'error', timestamp: Date.now(), data:{ message: String(e?.message||e) } });
    }finally{ clearTimeout(to); }
  }
}
