/**
 * demo 冒烟 —— 9 个示例（与 antd 用户可见 demo 一一对应）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Rate', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
  global: { stubs: { teleport: false } },
});
