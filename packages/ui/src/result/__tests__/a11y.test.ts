/**
 * L5 · 无障碍 —— Result 无 ARIA 输出（上游语义）；axe 扫全部 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Result', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
