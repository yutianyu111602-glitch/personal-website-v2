import React from 'react';
import OrganizeSectionLayout from '../src/layout/OrganizeSectionLayout';
import ToolbarDock from '../src/layout/ToolbarDock';

const Card = (t:string)=>(
  <div className="p-4 rounded-xl" style={{background:'rgba(192,197,206,0.05)',border:'1px solid rgba(192,197,206,0.15)'}}>
    <div className="text-sm opacity-70">{t}</div>
  </div>
);

export default function OrganizePageExample(){
  return (
    <div className="space-y-4">
      <ToolbarDock left={Card('筛选')} center={Card('摘要')} right={Card('帮助/设置')} />
      <OrganizeSectionLayout left={Card('左：分类/过滤')} right={<div className="space-y-4">{Card('右：主表/卡片')}{Card('右：批处理')}</div>} />
    </div>
  );
}
