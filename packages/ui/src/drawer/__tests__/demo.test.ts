/** demo 冒烟 —— 18 个示例（与 antd 用户可见 demo 一一对应，`expectCount` 钉死）。 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Drawer', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 18,
  global: { stubs: { teleport: false } },
});
