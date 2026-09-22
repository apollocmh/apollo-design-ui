/**
 * demo 冒烟测试：4 个 demo 与 antd 非 debug demo 对应
 * （basic / multi-line / image / custom；portal 依赖未落地的 Modal + Drawer，
 *   登记为 README §5 缺口；debug 是 debug demo，不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Watermark', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 4,
});
