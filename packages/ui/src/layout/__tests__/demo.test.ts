/**
 * demo 冒烟测试：11 个 demo 与 antd 非 debug demo 一一对应
 * （basic / side / top / top-side / top-side-2 / fixed / fixed-sider /
 * custom-trigger / responsive / component-token / collapsible-overlay；
 * `_semantic` 与 `custom-trigger-debug` 是 debug，不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Layout', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
});
