/**
 * L5 · 无障碍 —— Layout 是纯语义结构：Header/Footer/Content 用原生地标元素
 * （`header` / `footer` / `main`），Sider 是 `aside`；触发器是可点击元素
 * （上游同结构，无额外 ARIA）。axe 扫全部 demo（0 violation）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Layout', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 11,
});
