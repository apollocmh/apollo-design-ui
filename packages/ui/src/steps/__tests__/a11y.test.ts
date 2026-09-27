/**
 * L5 · 无障碍 —— axe 扫全部 demo（0 violation）。
 *
 * 可访问性契约：可点击步为 `role="button"` + `tabIndex=0`（rc Step 的
 * accessibilityProps，L1 已钉住）；非交互步（无 onChange）不承担按钮角色。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Steps', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 20,
  global: { stubs: { teleport: false } },
});
