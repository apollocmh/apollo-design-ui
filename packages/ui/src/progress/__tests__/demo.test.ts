/** demo 冒烟 —— 17 个示例（与 antd 用户可见 demo 一一对应；component-token 为
 * Token 定制演示并入 docs，不单列）。 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('Progress', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 17,
  global: { stubs: { teleport: false } },
});
