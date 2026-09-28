/**
 * demo 冒烟：5 个 demo（basic / multiple / search / change-on-select / panel）。
 * `_semantic` 不进冒烟。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Cascader', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 5,
});
