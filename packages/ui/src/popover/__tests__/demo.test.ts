/**
 * demo 冒烟 —— 12 个示例（与 antd 用户可见 demo 一一对应；Segmented 未落地 ⇒
 * 原生 select 替换，wireframe/component-token 的 ConfigProvider 主题覆盖以默认
 * 主题渲染，各 demo 文件头登记）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Popover', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
  global: { stubs: { teleport: false } },
});
