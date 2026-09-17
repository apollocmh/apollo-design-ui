/**
 * demo 冒烟测试：每个 demo 都能渲染且**不产生告警**。
 *
 * `expectCount` 与 antd 6.6.4 的 `components/empty/demo/` 一一对应（6 个）。
 * 它同时是一条防腐断言：删掉一个 demo 会让「demo 与 antd 对齐」这句话失效，
 * 而只数「有几个文件」是数不出这件事的。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Empty', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
