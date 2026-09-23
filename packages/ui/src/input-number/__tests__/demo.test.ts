/**
 * demo 冒烟 —— 每个示例渲染不抛错、无告警；expectCount 钉死数量。
 * 对齐 antd 的非 debug demo 面（12 个：basic/size/disabled/digit/formatter/
 * keyboard/variant/spinner/out-of-range/presuffix/status/style-class）。
 * debug 类（addon/render-panel/debug-token/filled-debug 等）不进冒烟。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('InputNumber', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});
