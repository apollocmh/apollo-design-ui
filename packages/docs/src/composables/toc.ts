/**
 * 页面级共享状态：本页目录（TOC）。
 * SiteLayout 右栏渲染它，页面组件负责写入 —— 避免「子组件填充父布局具名插槽」
 * 的嵌套限制，也让任何页面（组件页 / 指南页）都能声明自己的目录。
 */
import { ref } from 'vue';
import type { TocItem } from '../types/manifest';

const items = ref<TocItem[]>([]);

export function useTocState() {
  function setToc(next: TocItem[]): void {
    items.value = next;
  }
  return { items, setToc };
}

/**
 * 把「代码演示」锚点插进文档 TOC 的**正确位置**（intro 与 rest 的交界）。
 *
 * 🚨 不能追加到末尾（2026-10-20 修）：生成器 `splitDocBody()` 用 `## 代码演示`
 *    作切分点、把它**连同标题一起吃掉**，所以 `doc.toc` 里天然没有这一项。
 *    旧实现 `[...toc, demo]` ⇒ 目录里「代码演示」从正文第 3 位掉到最后，
 *    与正文顺序不符（用户报「表格文档页目录没更新」）。
 *
 * 正文顺序恒为 intro → 代码演示 → rest（API…），而 rest 的第一个二级标题在所有
 * 组件文档里都是 `API`（`id="api"`）⇒ 以它为锚点插入；没有 API 章节时退化为追加
 * （宁可顺序差一点，也不要丢掉入口）。
 */
export function withDemoAnchor(items: TocItem[], demoText: string): TocItem[] {
  const demoItem: TocItem = { level: 2, text: demoText, id: 'demos' };
  const apiIndex = items.findIndex((item) => item.level === 2 && item.id.toLowerCase() === 'api');
  if (apiIndex === -1) return [...items, demoItem];
  return [...items.slice(0, apiIndex), demoItem, ...items.slice(apiIndex)];
}
