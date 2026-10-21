/**
 * 图标目录的纯逻辑（2026-10-21 审计 A13）。
 *
 * 过滤与代码片段生成都不依赖 Vue / DOM，便于直接钉住；页面只负责渲染与复制。
 */
import type { IconMeta, IconStyle } from '../types/manifest';

export type IconStyleFilter = 'all' | IconStyle;
export type IconCopyMode = 'name' | 'import' | 'tag';

export function filterIcons(
  items: readonly IconMeta[],
  query: string,
  style: IconStyleFilter,
): IconMeta[] {
  const q = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      (style === 'all' || item.style === style) && (!q || item.name.toLowerCase().includes(q)),
  );
}

/** 点击图标时复制的内容：名称 / 可直接运行的 import / Vue 模板标签。 */
export function iconSnippet(name: string, mode: IconCopyMode): string {
  if (mode === 'name') return name;
  if (mode === 'tag') return `<${name} />`;
  return `import { ${name} } from '@apollo-design/icons';`;
}
