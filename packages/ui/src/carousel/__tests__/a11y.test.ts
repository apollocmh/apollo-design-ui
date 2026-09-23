/**
 * L5 · 无障碍 —— Carousel 的可访问性来自 dots 的 button（可聚焦）与 arrows button
 * （aria-label 来自 locale）；slide 是 `aria-hidden` + `tabindex=-1`，键盘 Left/Right
 * 切换（accessibility 默认 true）。axe 扫全部 7 个 demo。
 *
 * ⚠️ antd 的 dots button 没有可访问名（文本是裸数字、li 有 text-indent:-999px）——
 *    上游自己的 a11y 缺口，逐字保留（axe 对数字文本不判 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Carousel', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 7,
});
