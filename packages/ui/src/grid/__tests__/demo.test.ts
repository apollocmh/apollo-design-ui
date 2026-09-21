/**
 * demo 冒烟测试：13 个 demo 与 antd 一一对应（antd 无 debug demo；
 * playground 的 Slider 与 useBreakpoint 的展示用原生元素/hook 等价）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Grid', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
