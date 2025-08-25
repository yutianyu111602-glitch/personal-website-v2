# 总线接线指南（把 EventBusAdapter 换成你的 UnifiedEventBus）

两种方案：

## A. 直接改 `EventBusAdapter.unified.ts`
1. 把你的总线导入：`import { UnifiedEventBus } from '@/components/events/UnifiedEventBus'`
2. 将 `RealBus.on/off/emit/emitBpm/emitMood/emitPreset` 映射到你真实的方法名
3. 在工程里 **优先使用 unified 版本**（或把 `EventBusAdapter.ts` 替换成 unified 版本内容）

## B. 在现有总线外包一层桥接
- 保持 `EventBusAdapter.ts` 文件名不变，把里面的默认内存实现替换成你真实总线的调用即可。
- 注意命名空间/类型要与 `automix`/`visualization` 对齐。
