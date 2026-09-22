/**
 * demo 冒烟测试：6 个 demo 与 antd 非 debug demo 一一对应
 * （animated / basic / card / style-class / timer / unit；
 * _semantic 是 debug，不进冒烟；antd 的 component-token demo 由 L7 主题测试覆盖）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Statistic', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 6,
});
