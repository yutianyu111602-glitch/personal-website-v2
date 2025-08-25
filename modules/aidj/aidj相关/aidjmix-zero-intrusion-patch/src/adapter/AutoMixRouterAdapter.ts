import type { RouterAdapterConfig, TransitionEventPayload, VolumeEventPayload } from '../types/contracts';

/**
 * AutoMixRouterAdapter —— 把 automix 的“过渡”事件路由到电台 REST
 * 零侵入：只订阅总线与 fetch，不改 UI/播放器。
 */
export class AutoMixRouterAdapter {
  private cfg: Required<RouterAdapterConfig>;
  private lastAt = 0;
  private attached = false;
  constructor(cfg: RouterAdapterConfig){
    this.cfg = {
      ENDPOINT_NEXT: cfg.ENDPOINT_NEXT,
      ENDPOINT_PREV: cfg.ENDPOINT_PREV,
      ENDPOINT_CROSSF: cfg.ENDPOINT_CROSSF,
      ENDPOINT_VOLUME: cfg.ENDPOINT_VOLUME,
      DEFAULT_CROSSFADE_MS: cfg.DEFAULT_CROSSFADE_MS ?? 4000,
      SAFETY_RATE_LIMIT_MS: cfg.SAFETY_RATE_LIMIT_MS ?? 1200,
    } as Required<RouterAdapterConfig>;
  }

  attach(){
    if (this.attached) return;
    this.attached = true;
    const Bus: any = (window as any).UnifiedEventBus;
    if (!Bus || typeof Bus.on !== 'function') {
      console.warn('[router] UnifiedEventBus missing, adapter idle');
      return;
    }
    Bus.on('automix','transition',(e: any)=> this.onTransition(e));
    Bus.on('playback','volume',(e: any)=> this.onVolume(e));
    console.log('[router] attached');
  }

  private async onTransition(e: any){
    const now = Date.now();
    if (now - this.lastAt < this.cfg.SAFETY_RATE_LIMIT_MS) return; // 防抖
    this.lastAt = now;

    const data: TransitionEventPayload = e?.data || {};
    const action = data.action;
    try{
      if (action === 'next' && this.cfg.ENDPOINT_NEXT){
        await fetch(this.cfg.ENDPOINT_NEXT, { cache: 'no-store' });
      } else if (action === 'prev' && this.cfg.ENDPOINT_PREV){
        await fetch(this.cfg.ENDPOINT_PREV, { cache: 'no-store' });
      } else if (action === 'crossfade' && this.cfg.ENDPOINT_CROSSF){
        const dur = data.durationMs ?? this.cfg.DEFAULT_CROSSFADE_MS;
        const url = this.cfg.ENDPOINT_CROSSF.replace('{ms}', String(dur));
        await fetch(url, { cache: 'no-store' });
      }
    }catch(err){
      console.warn('[router] transition failed', err);
    }
  }

  private async onVolume(e: any){
    if (!this.cfg.ENDPOINT_VOLUME) return;
    const data: VolumeEventPayload = e?.data || {};
    const v = data.level;
    if (typeof v !== 'number') return;
    try{
      const url = this.cfg.ENDPOINT_VOLUME.replace('{v}', String(v));
      await fetch(url, { cache:'no-store' });
    }catch(err){
      console.warn('[router] volume failed', err);
    }
  }
}
