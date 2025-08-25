// BusAdapter.ts —— 事件总线占位。由 Cursor 对接到你的 UnifiedEventBus。
// 注意：此文件默认全部 NO-OP，不会影响现网。

// ========== 类型约定（勿删） ==========
export type BusCallback = (e: any) => void;
export interface IBus {
  on(ns: string, type: string, cb: BusCallback): () => void;
  emit(evt: { namespace: string; type: string; timestamp: number; data?: any }): void;
  emitPreset(name: string): void;
}

// ========== NO-OP 实现（默认安全） ==========
const noop = () => {};
const off = () => noop;

export const BusAdapter: IBus = {
  on(_ns, _type, _cb) { return off; },
  emit(_evt) {},
  emitPreset(_name) {}
};

// ========== 便捷封装（命名保持你的生态风格） ==========
export const onMood = (cb: BusCallback) => BusAdapter.on('automix', 'mood', cb);
export const onEnergy = (cb: BusCallback) => BusAdapter.on('automix', 'energy', cb);
export const onBpm = (cb: BusCallback) => BusAdapter.on('automix', 'bpm', cb);
export const onTransition = (cb: BusCallback) => BusAdapter.on('automix', 'transition', cb);
export const onPreset = (cb: BusCallback) => BusAdapter.on('visualization', 'preset', cb);
export const onPlan = (cb: BusCallback) => BusAdapter.on('automix', 'plan', cb);

export const emit = (evt: { namespace: string; type: string; data?: any }) =>
  BusAdapter.emit({ ...evt, timestamp: Date.now() });

export const emitPreset = (name: string) => BusAdapter.emitPreset(name);

// ========== Cursor 必填 TODO ==========
// - 把 BusAdapter 替换为你项目里的 UnifiedEventBus 映射：
//   - on(ns,type,cb) → 你总线的订阅方法
//   - emit({namespace,type,data}) → 你总线的广播方法
//   - emitPreset(name) → 你项目已有的 emitPreset
// - 若你的总线不区分 namespace/type，请在映射层组装 key（例如 `${ns}:${type}`）。
