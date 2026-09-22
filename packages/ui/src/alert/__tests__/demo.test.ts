/**
 * demo 冒烟测试：13 个 demo 与 antd 非 debug demo 一一对应
 * （action / banner / basic / closable / custom-icon / custom-title-alignment /
 * description / error-boundary / filled / icon / loop-banner / smooth-closed /
 * style-class；_semantic 是 debug，不进冒烟；component-token 由 L7 主题测试覆盖）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Alert', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
