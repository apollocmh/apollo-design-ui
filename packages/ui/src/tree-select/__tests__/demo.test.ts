/**
 * demo 冒烟（G11）：15 个 demo 与 antd 一一对应（防腐断言）。
 * 「不产生告警」是 demo 的硬约束。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('TreeSelect', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 15,
});
