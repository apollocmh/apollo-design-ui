/**
 * demo 冒烟测试：14 个 demo 与 antd 非 debug demo 一一对应
 * （basic / disabled / radiogroup / radiogroup-options / radiogroup-more /
 * radiogroup-with-name / radiogroup-block / radiobutton / radiobutton-solid /
 * size / style-class / badge / component-token / wireframe；
 * `_semantic` 与 2 个 debug-* 不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Radio', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
});
