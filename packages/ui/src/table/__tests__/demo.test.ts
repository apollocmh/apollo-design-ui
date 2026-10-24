/**
 * demo 冒烟（G11）：24 个 demo 与 antd 一一对应（防腐断言）。
 * 「不产生告警」是 demo 的硬约束。
 *
 * ⚠️ `expectCount` 是硬门禁：新增 demo 必须同步 +1，删 demo 必须同步 -1 ——
 *    否则「补了示例却没进文档」这类漂移不会被任何人发现。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Table', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 44,
});
