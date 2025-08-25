// EventBusAdapter.unified.ts —— **把这份换成你的真实 UnifiedEventBus**
// 如果你的总线提供：on(type,cb)/off(type,cb)/emit(event) 等，就按下列映射改。

type Callback = (e:any)=>void;

// TODO(You): 正式引入你的总线（示例）：
// import { UnifiedEventBus } from '@/components/events/UnifiedEventBus';

// 以下是占位映射，请按实际项目 API 改名/改参：
const RealBus = {
  on(ns:string, type:string, cb:Callback){
    // return UnifiedEventBus.on({ namespace: ns, type }, cb);
    return ()=>{};
  },
  off(ns:string, type:string, cb:Callback){
    // UnifiedEventBus.off({ namespace: ns, type }, cb);
  },
  emit(payload:any){
    // UnifiedEventBus.emit(payload);
  },
  emitBpm(bpm:number){
    // UnifiedEventBus.emitBpm(bpm);
  },
  emitMood(m:any){
    // UnifiedEventBus.emitMood(m);
  },
  emitPreset(name:string){
    // UnifiedEventBus.emitPreset(name);
  }
};

export const EventBus = RealBus;
export const onMood = (cb:Callback)=> RealBus.on('automix','mood',cb);
export const onBpm = (cb:Callback)=> RealBus.on('automix','bpm',cb);
export const onTransition = (cb:Callback)=> RealBus.on('automix','transition',cb);
export const onPreset = (cb:Callback)=> RealBus.on('visualization','preset',cb);
export const onPlan = (cb:Callback)=> RealBus.on('automix','plan',cb);

export const emitRequest = (data:any)=> RealBus.emit({ namespace:'automix', type:'request', timestamp:Date.now(), data });
export const emitMood = (m:any)=> RealBus.emitMood(m);
export const emitBpm = (bpm:number)=> RealBus.emitBpm(bpm);
export const emitPreset = (name:string)=> RealBus.emitPreset(name);
