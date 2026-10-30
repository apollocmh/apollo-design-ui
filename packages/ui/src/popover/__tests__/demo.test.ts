/**
 * demo 冒烟 —— 12 个示例（与 antd 用户可见 demo 一一对应；Segmented 未落地 ⇒
 * 原生 select 替换；组件 Token 示例使用当前 ConfigProvider）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Popover', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
  global: { stubs: { teleport: false } },
});
