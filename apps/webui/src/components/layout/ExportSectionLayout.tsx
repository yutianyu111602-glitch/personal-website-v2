import React from 'react';

/** ExportSectionLayout —— 专用于导出页的"两栏布局外壳"（尺寸与位置） */
export interface ExportLayoutSlots {
  A?: React.ReactNode; B?: React.ReactNode; C?: React.ReactNode; D?: React.ReactNode;
  E?: React.ReactNode; F?: React.ReactNode; G?: React.ReactNode; H?: React.ReactNode;
}

export interface ExportSectionLayoutProps extends ExportLayoutSlots { 
  className?: string; 
}

const ExportSectionLayout: React.FC<ExportSectionLayoutProps> = ({ A,B,C,D,E,F,G,H,className }) => (
  <div className={['mx-auto w-full max-w-[1400px] px-4 lg:px-6', className||''].join(' ')}>
    <div className="grid grid-cols-12 gap-4 lg:gap-6">
      {/* 左侧：表单/选项/目标/操作 */}
      <section className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-4">
        {A}{B}{C}{D}
      </section>
      
      {/* 右侧：任务状态/进度/日志/队列 */}
      <aside className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4">
        {E}{F}
        {/* 日志区域独立滚动 */}
        {G ? <div className="max-h-[50vh] overflow-auto">{G}</div> : null}
        {H}
      </aside>
    </div>
  </div>
);

export default ExportSectionLayout;
