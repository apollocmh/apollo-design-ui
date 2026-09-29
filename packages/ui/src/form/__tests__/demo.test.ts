/**
 * demo 冒烟（G11）：5 个 demo 可加载、无告警（防腐断言）。
 *
 * ⚠️ 与 antd 的 demo 覆盖差距**显式登记**在 `README.md` §demo 覆盖表里 ——
 *    antd 的 demo 目录有 45 个，本仓先落 5 个（原因见那张表，不是漏做）。
 *    `expectCount` 把当前条数钉死，避免「悄悄少了两个 demo」这类回归。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Form', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 5,
});
