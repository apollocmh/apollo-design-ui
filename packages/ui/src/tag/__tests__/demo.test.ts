/**
 * demo 冒烟测试：11 个 demo 与 antd 非 debug demo 一一对应
 * （animation / basic / checkable / colorful / control / customize / disabled /
 * draggable / icon / status / style-class；component-token 是 debug，不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Tag', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
});
