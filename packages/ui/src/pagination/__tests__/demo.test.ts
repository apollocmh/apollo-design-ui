/**
 * demo 冒烟（G11）：12 个 demo 可加载、无告警（防腐断言）。
 *
 * ⚠️ antd 6.6.4 的 `components/pagination/demo/` 有 16 个 `.tsx`，本仓落 **12 个**；
 *    未覆盖的 4 个与原因写在 `README.md` §8（不是漏做）：
 *    `_semantic`（上游内部语义调试页）、`component-token` / `style-class`（依赖 antd-style
 *    与 ConfigProvider 的样式逃生口）、`variant-debug`（上游内部变体调试页）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Pagination', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});
