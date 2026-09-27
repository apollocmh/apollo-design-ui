/** demo 冒烟 —— 10 个示例（与 antd 用户可见 demo 一一对应；custom/render-panel 为缺口/调试不对外）。 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('AutoComplete', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
  global: { stubs: { teleport: false } },
});
