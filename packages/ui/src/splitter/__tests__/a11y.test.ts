/**
 * L5 · 无障碍 —— Splitter 的语义来自原生 separator 角色与折叠按钮（role=button）；
 * axe 扫全部 4 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Splitter', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 4,
});
