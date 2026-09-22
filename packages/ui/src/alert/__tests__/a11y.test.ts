/**
 * L5 · 无障碍 —— role="alert"（可被用户 role 覆盖）、关闭按钮的 aria-* 透传
 * 由 L1/L4 钉；axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Alert', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
