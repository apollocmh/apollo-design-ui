/**
 * L5 · 无障碍 —— BackTop 无 ARIA 输出（上游语义）；axe 扫 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('BackTop', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 1,
});
