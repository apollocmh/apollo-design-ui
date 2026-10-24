/**
 * demo 冒烟 —— 36 个示例（与 antd 用户可见 demo 一一对应；
 * expectCount 钉死数量，防漏防重）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Select', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 36,
  global: { stubs: { teleport: false } },
});
