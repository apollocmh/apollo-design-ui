/**
 * demo 冒烟测试：10 个 demo 与 antd 非 debug demo 一一对应
 * （basic / locale / icon / promise / async / placement / dynamic-trigger /
 * render-panel / style-class / shift；`_semantic` 与 `wireframe` 不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Popconfirm', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
});
