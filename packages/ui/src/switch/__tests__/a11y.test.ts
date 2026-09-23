/**
 * L5 · 无障碍 —— 原生 `<button role="switch" aria-checked>`（键盘可达；可访问名来自
 * `checkedChildren` / `unCheckedChildren` 的内容，或 `aria-label`）；左右方向键切换。
 * axe 扫全部 7 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Switch', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 7,
});
