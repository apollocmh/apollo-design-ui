/**
 * demo 冒烟 —— 20 个示例（对齐 antd 用户可见 demo；_semantic 系列为内部测试固件不对外）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Steps', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 20,
  global: { stubs: { teleport: false } },
});
