/**
 * demo 冒烟 —— 14 个示例（与 antd 用户可见 demo 一一对应；Segmented/Select
 * 未落地 ⇒ 原生 select 替换，各 demo 文件头登记）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Tooltip', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});
