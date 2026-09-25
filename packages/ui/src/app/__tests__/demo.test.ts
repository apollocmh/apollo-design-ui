/** demo 冒烟 —— 2 个示例（与 antd 用户可见 demo 一一对应）。 */
import { demoTest } from '@apollo-design/test-utils';

demoTest('App', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 2,
});
