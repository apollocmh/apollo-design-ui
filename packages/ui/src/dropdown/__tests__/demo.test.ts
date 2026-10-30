/**
 * demo 冒烟 —— 19 个示例（与 antd 用户可见 demo 一一对应；item 的 label 锚点
 * 简化为纯文本，语义等价，各 demo 文件头登记）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Dropdown', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 19,
  global: { stubs: { teleport: false } },
});
