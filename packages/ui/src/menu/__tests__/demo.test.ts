/**
 * demo 冒烟 —— 13 个示例（与 antd 用户可见 demo 一一对应；component-token 的
 * ConfigProvider 主题覆盖以默认主题渲染，各 demo 文件头登记）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Menu', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
  global: { stubs: { teleport: false } },
});
