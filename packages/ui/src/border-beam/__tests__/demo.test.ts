/**
 * demo 冒烟测试：8 个 demo 与 antd 非 debug demo 一一对应
 * （basic / hover / count / custom-container / customized-color / duration / size /
 * line-width；non-uniform-radius 与 component-token 是 debug，不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('BorderBeam', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 8,
});
