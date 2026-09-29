/**
 * demo 冒烟（G11）：13 个 demo 可加载、无告警（防腐断言）。
 *
 * ⚠️ antd 6.6.4 的 `components/slider/demo/` 有 16 个 `.tsx`，本仓落 **13 个**；
 *    未覆盖的 3 个与原因写在 `README.md` §8（不是漏做）：
 *    `_semantic`（上游内部语义调试页）、`component-token` / `style-class`
 *    （依赖 antd-style 与 ConfigProvider 的样式逃生口，本仓无该机制）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Slider', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
