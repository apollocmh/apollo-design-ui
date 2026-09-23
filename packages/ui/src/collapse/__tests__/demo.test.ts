/**
 * L5 · demo 渲染 —— Collapse（每个 demo 可挂载、无控制台报错）
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Collapse', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 4,
});
