/**
 * demo 冒烟 —— demo 与 antd 用户可见 demo 一一对应（9 个：basic / mask /
 * non-modal / actions-render / indicator / placement / gap / render-panel /
 * style-class）。「不产生告警」是 demo 的硬约束。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Tour', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
