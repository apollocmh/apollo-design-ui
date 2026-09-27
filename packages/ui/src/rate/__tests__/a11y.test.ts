/**
 * L5 · 无障碍 —— axe 扫全部 demo（0 violation）。
 *
 * 契约：每颗星是 `role="radio"`（rc Star 逐字）+ aria-checked/posinset/setsize；
 * 键盘由根 ul 承担（方向键），星上 Enter 触发点击。disabled 时 tabIndex=-1。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Rate', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 9,
  global: { stubs: { teleport: false } },
});
