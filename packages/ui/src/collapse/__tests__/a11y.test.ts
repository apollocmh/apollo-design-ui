/**
 * L5 · 无障碍 —— Collapse 的语义来自原生按钮/标题结构与 tablist（accordion）；
 * axe 扫全部 4 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Collapse', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 4,
});
