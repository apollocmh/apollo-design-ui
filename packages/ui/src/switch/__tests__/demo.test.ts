/**
 * demo 冒烟测试：7 个 demo 与 antd 非 debug demo 一一对应
 * （basic / disabled / loading / size / text / style-class / component-token；
 * `_semantic` 不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Switch', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 7,
});
