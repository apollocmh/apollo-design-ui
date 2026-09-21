/**
 * demo 冒烟测试：9 个 demo 与 antd 非 debug demo 一一对应
 * （success / info / warning / 403 / 404 / 500 / error / customIcon / style-class；
 * component-token 是 debug、_semantic 是内部页，不进冒烟）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Result', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
});
