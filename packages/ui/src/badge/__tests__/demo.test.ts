/**
 * demo 冒烟测试：12 个 demo 与 antd 的**用户可见** demo 一一对应
 * （basic / no-wrapper / overflow / dot / change / link / offset / size / status /
 * colorful / ribbon / style-class）。4 个 debug demo（ribbon-debug / mix / title /
 * colorful-with-count-debug / component-token）与 2 个 _semantic 不进冒烟。
 *
 * 依赖缺口：Avatar / Icon / Button+Icon / Card 用原生元素或已落地组件等价替换
 * （缺口登记在 README §7）；「不产生告警」对替换后的 demo 依然是硬约束。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Badge', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});
