/**
 * L5 · 无障碍 —— axe 扫全部 demo（0 violation）。
 *
 * 契约：内部是 Button（button/a 元素 + aria-label 透传）；Group 的触发按钮
 * 带 aria-label（'aria-label' prop 逐字透传）。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('FloatButton', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
  global: { stubs: { teleport: false } },
});
