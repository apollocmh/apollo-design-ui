/**
 * demo 冒烟测试：14 个 demo 与 antd 非 debug demo 一一对应
 * （basic / controlled / block / disabled / dynamic / icon-only / with-icon /
 * custom / shape / size / vertical / with-name / style-class / component-token；
 * `_semantic` 不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Segmented', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
});
