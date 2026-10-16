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
