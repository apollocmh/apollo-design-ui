/** demo 冒烟 —— 12 个示例（与 antd 用户可见 demo 一一对应；draggable 为用户级 dnd 组合、render-panel/badge-debug 为调试不对外）。 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('FloatButton', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
  global: { stubs: { teleport: false } },
});
