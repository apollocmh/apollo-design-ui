/**
 * L5 · 原生 heading/button/region；accordion 只改变单开状态。axe 扫全部 9 个实际 Demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Collapse', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
