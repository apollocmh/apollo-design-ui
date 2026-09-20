/**
 * demo 冒烟测试：每个 demo 都能渲染、更新、卸载，且**不产生任何告警**。
 *
 * 12 个 demo 覆盖 Button 的完整视觉面：type / size / loading / disabled / danger /
 * ghost / block / icon / shape / color-variant / href / semantic。
 *
 * ⚠️ 「不产生告警」对 Button 有**实际**约束，demo 里不能出现：
 *   1. `icon` 传长度 > 2 的字符串（v6 里 `icon` 是 VNode）⇒ 必须传组件或用插槽；
 *   2. `ghost` 与 `text` / `link` 变体同时用 ⇒ `ghost.vue` 里只与有边框变体组合。
 *
 * `expectCount` 是防腐断言：删掉一个 demo 会让「demo 覆盖了整个视觉面」这句话失效，
 * 而只数「有几个文件」数不出这件事。
 */

import { demoTest } from '@apollo-design/test-utils';

demoTest('Button', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});
