/**
 * EmotionTechniqueBridge —— 从情绪/能量/BPM/段落 推导“切歌手法建议”
 * 特点：
 * - 只“建议”，不强制；通过事件总线广播 `automix:technique_recommend`
 * - 兼容你现有 20 种手法，未命中规则时回落 simple_head_tail
 * - 带理由 `reason[]`，便于 UI 展示与排错
 * - 逻辑-only，不依赖端口与后端
 */
type Mood = { energy:number; valence:number; arousal:number };
type Recomm = { technique:string; hint?:any; reason:string[] };

export interface TechniqueBridgeConfig {
  enable?: boolean;                 // 是否启用（默认为 true）
  minBpmForDoubleDrop?: number;     // 默认 140
  crossfadeMs?: number;             // 默认 4000
  EventBus: any;                    // UnifiedEventBus 实例（必填）
}

export class EmotionTechniqueBridge {
  private bpm = 126;
  private mood: Mood = { energy:0.6, valence:0, arousal:0.5 };
  private segment: 'steady'|'build'|'fill'|'drop'|'break' = 'steady';
  private cfg: Required<TechniqueBridgeConfig>;

  constructor(cfg: TechniqueBridgeConfig){
    this.cfg = {
      enable: cfg.enable ?? true,
      minBpmForDoubleDrop: cfg.minBpmForDoubleDrop ?? 140,
      crossfadeMs: cfg.crossfadeMs ?? 4000,
      EventBus: cfg.EventBus
    };
  }

  attach(){
    const bus = this.cfg.EventBus;
    if (!bus) return;

    // 订阅情绪/能量/BPM/过渡
    bus.on('mood','update',(e:any)=>{
      const m = e?.data?.mood; if (!m) return;
      this.mood = { ...this.mood, ...m };
      this.tick();
    });
    bus.on('bpm','update',(e:any)=>{
      const b = Number(e?.data?.bpm); if (!Number.isFinite(b)) return;
      this.bpm = b; this.tick();
    });
    bus.on('automix','transition',(e:any)=>{
      const seg = e?.data?.segment; if (seg) this.segment = seg;
      // 过渡时机也重新评估一次（供 UI 展示）
      this.tick();
    });

    // 订阅可视化段落（若有）
    bus.on('visualization','effect',(e:any)=>{
      const seg = e?.data?.pipeline?.segment; if (seg) this.segment = seg;
    });

    // 启动时广播一次
    this.tick();
  }

  private tick(){
    if (!this.cfg.enable) return;
    const rec = this.choose();
    this.cfg.EventBus.emit({
      namespace: 'automix',
      type: 'technique_recommend',
      timestamp: Date.now(),
      data: rec
    });
  }

  private choose(): Recomm {
    const { bpm, mood, segment } = this;
    const reason: string[] = [];
    const energy = mood.energy, arousal = mood.arousal;

    // 1) 兜底：若无 bpm → 极简稳定手法
    if (!Number.isFinite(bpm) || bpm <= 0){
      reason.push('no_bpm');
      return { technique: 'simple_head_tail', hint:{ crossfadeMs: this.cfg.crossfadeMs }, reason };
    }

    // 2) 高速 + 高能量 + drop 段落 → 双落（约束：满足高 BPM）
    if (bpm >= this.cfg.minBpmForDoubleDrop && energy >= 0.7 && (segment==='drop' || arousal>=0.7)){
      reason.push('high_bpm','high_energy','drop_segment');
      return { technique: 'double_drop_32', hint:{ bars: 32 }, reason };
    }

    // 3) 中高能量 & build/fill → 16 拍短切
    if (energy >= 0.55 && (segment==='build' || segment==='fill' || arousal>=0.6)){
      reason.push('mid_energy','build_or_fill');
      return { technique: 'phrase_cut_16', hint:{ bars: 16 }, reason };
    }

    // 4) 低能量 / 稳态 → 24/32 拍长层叠
    if (energy < 0.45 || segment==='steady' || segment==='break'){
      reason.push('low_energy_or_steady');
      return { technique: 'long_layer_24', hint:{ bars: 24 }, reason };
    }

    // 5) 默认：安全 crossfade
    reason.push('default_fallback');
    return { technique: 'simple_head_tail', hint:{ crossfadeMs: this.cfg.crossfadeMs }, reason };
  }
}
