/**
 * L5 · 无障碍 —— axe 扫全部 demo（0 violation）+ menu 的 aria 面由 menu 层
 * 承担（role=menu/menuitem 由 Menu/MenuItem 提供，L4/L5 已在 menu 钉住）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Dropdown', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 19,
  global: { stubs: { teleport: false } },
});
