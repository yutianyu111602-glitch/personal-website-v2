import React from 'react';
import ExportSectionLayout from '../src/layout/ExportSectionLayout';
import StatusHeader from '../src/layout/StatusHeader';

/** 仅示意：把你现有卡片塞入布局，不改卡片内容 */
export default function ExportPageExample(){
  const Card = (t:string)=>(
    <div className="p-4 rounded-xl" style={{background:'rgba(192,197,206,0.05)',border:'1px solid rgba(192,197,206,0.15)'}}>
      <div className="text-sm opacity-70">{t}</div>
    </div>
  );
  return (
    <div className="space-y-4">
      <StatusHeader left={Card('LEFT')} center={Card('CENTER')} right={Card('RIGHT')} />
      <ExportSectionLayout
        A={Card('A 源文件选择')}
        B={Card('B 导出选项')}
        C={Card('C 导出目标')}
        D={Card('D 操作区')}
        E={Card('E 任务状态')}
        F={Card('F 进度时间')}
        G={Card('G 日志（滚动）')}
        H={Card('H 队列（可选）')}
      />
    </div>
  );
}
