/**
 * demo 冒烟 —— 14 个示例（与 antd 用户可见 demo 一一对应）。
 *
 * ⚠️ 数量由 `expectCount` 钉死：少一个/多一个都红。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Notification', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});
