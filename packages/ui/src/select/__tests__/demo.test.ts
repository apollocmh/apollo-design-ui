/**
 * demo 冒烟 —— 37 个原生示例（含三个模型与动态主题；
 * expectCount 钉死数量，防漏防重）。
 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Select', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 37,
  global: { stubs: { teleport: false } },
});
