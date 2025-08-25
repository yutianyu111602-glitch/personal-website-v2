// 占位：如果你的项目已有，请删除本文件并使用你原有的类型。
export interface Manager {
  id: string;
  init(): void;
  start(): void;
  stop(): void;
  dispose(): void;
}
