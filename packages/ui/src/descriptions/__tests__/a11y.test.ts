/**
 * L5 · 无障碍 —— Descriptions 的语义来自原生 `<table>` 结构（th/td）与 header 块；
 * axe 扫全部 6 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Descriptions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
