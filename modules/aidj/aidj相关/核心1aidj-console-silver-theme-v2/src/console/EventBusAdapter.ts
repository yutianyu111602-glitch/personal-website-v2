// 事件总线适配器（默认内存实现）。替换为 UnifiedEventBus 请看同目录 unified 版本与 docs/WIRING_GUIDE.md。

type Callback = (e:any)=>void;
const _h = new Map<string, Set<Callback>>();
const K = (ns:string,t:string)=> `${ns}::${t}`;

export const EventBus = {
  on(ns:string,t:string,cb:Callback){ const k=K(ns,t); if(!_h.has(k)) _h.set(k,new Set()); _h.get(k)!.add(cb); return ()=> EventBus.off(ns,t,cb); },
  off(ns:string,t:string,cb:Callback){ const k=K(ns,t); _h.get(k)?.delete(cb); },
  emit(p:any){ const k=K(p.namespace||'',p.type||''); _h.get(k)?.forEach(cb=>{ try{cb(p)}catch{} }); }
};

// 便捷封装：命名对齐你现有的 automix 可观察事件
export const onMood = (cb:Callback)=> EventBus.on('automix','mood',cb);
export const onBpm = (cb:Callback)=> EventBus.on('automix','bpm',cb);
export const onTransition = (cb:Callback)=> EventBus.on('automix','transition',cb);
export const onPreset = (cb:Callback)=> EventBus.on('visualization','preset',cb);
export const onPlan = (cb:Callback)=> EventBus.on('automix','plan',cb);

export const emitRequest = (data:any)=> EventBus.emit({ namespace:'automix', type:'request', timestamp:Date.now(), data });
export const emitMood = (m:any)=> EventBus.emit({ namespace:'automix', type:'mood', timestamp:Date.now(), data:{ mood:m } });
export const emitBpm = (bpm:number)=> EventBus.emit({ namespace:'automix', type:'bpm', timestamp:Date.now(), data:{ bpm } });
export const emitPreset = (name:string)=> EventBus.emit({ namespace:'visualization', type:'preset', timestamp:Date.now(), data:{ name } });
