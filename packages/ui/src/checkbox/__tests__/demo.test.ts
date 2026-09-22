/**
 * demo 冒烟测试：8 个 demo 与 antd 非 debug demo 一一对应
 * （basic / disabled / controller / group / check-all / layout / style-class /
 * custom-line-width；_semantic 与 3 个 debug-* 不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Checkbox', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
