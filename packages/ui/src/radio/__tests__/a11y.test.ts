/**
 * L5 · 无障碍 —— 原生 `<input type="radio">` + `<label>`（label 包裹 ⇒ 文本即可访问名）；
 * Group 的 `role="radiogroup"`；无额外 ARIA 需要。axe 扫全部 14 个 demo。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Radio', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
});
