/**
 * L5 · 无障碍 —— axe 扫全部 demo。
 *
 * ARIA 契约由 Select 的 SearchInput 承担（role=combobox + aria-expanded 等，
 * select 期已钉住）；AutoComplete 只是薄包装，无新增角色。
 *
 * ⚠️ 不再豁免 `label`：所有 demo 的 combobox 都显式提供 `aria-label`
 * （2026-10-21 阶段 2 新增 demo 时收紧；`allow` 必须被命中，留着反而会腐烂）。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('AutoComplete', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
  global: { stubs: { teleport: false } },
});
