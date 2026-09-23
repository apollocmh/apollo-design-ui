/**
 * L5 · 无障碍 —— Listy 的语义来自原生滚动容器与文本内容；
 * axe 扫全部 4 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Listy', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 4,
});
