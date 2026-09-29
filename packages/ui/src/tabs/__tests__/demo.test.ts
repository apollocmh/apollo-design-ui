/**
 * demo 冒烟（G11）：13 个 demo 可加载、无告警（防腐断言）。
 *
 * ⚠️ antd 6.6.4 的 `components/tabs/demo/` 有 **21 个** `.tsx`，本仓落 **13 个**；
 *    未覆盖的 8 个与原因写在 `README.md` §8（不是漏做）。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Tabs', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 13,
});
