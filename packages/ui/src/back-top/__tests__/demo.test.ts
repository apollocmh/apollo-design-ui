/**
 * demo 冒烟测试：1 个 demo（deprecated 组件在 antd 只剩 basic）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('BackTop', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 1,
});
