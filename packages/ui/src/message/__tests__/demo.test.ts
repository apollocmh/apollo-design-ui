/**
 * demo 冒烟 —— 11 个示例（与 antd 用户可见 demo 一一对应）。
 *
 * ⚠️ antd 的 message **没有** `basic` demo（骨架默认生成的那个已删）——
 *    数量由 `expectCount` 钉死，少一个/多一个都红。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Message', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
  global: { stubs: { teleport: false } },
});
