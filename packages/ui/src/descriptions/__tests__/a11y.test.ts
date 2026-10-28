/**
 * L5 · 无障碍 —— Descriptions 的语义来自原生 dl/dt/dd 字段语义与 header 块；
 * axe 扫全部 13 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Descriptions', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
