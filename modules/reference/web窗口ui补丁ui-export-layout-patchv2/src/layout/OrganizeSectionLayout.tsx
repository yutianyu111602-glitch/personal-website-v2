import React from 'react';

/** OrganizeSectionLayout —— 歌单整理页布局：顶部工具条 + 左右两栏 */
export interface OrganizeSlots {
  toolbar?: React.ReactNode;   // 顶部工具条（筛选/搜索/批量操作）
  left?: React.ReactNode;      // 左：分类/源列表/过滤器
  right?: React.ReactNode;     // 右：内容表格/卡片/详情
}
const OrganizeSectionLayout: React.FC<OrganizeSlots> = ({ toolbar, left, right }) => {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6 space-y-4">
      {toolbar ? <div className="w-full">{toolbar}</div> : null}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <aside className="col-span-12 lg:col-span-3 space-y-4">{left}</aside>
        <section className="col-span-12 lg:col-span-9 space-y-4">{right}</section>
      </div>
    </div>
  );
};
export default OrganizeSectionLayout;
