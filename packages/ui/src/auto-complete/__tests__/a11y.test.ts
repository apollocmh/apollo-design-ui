/**
 * L5 · 无障碍 —— axe 扫全部 demo。
 *
 * ARIA 契约由 Select 的 SearchInput 承担（role=combobox + aria-expanded 等，
 * select 期已钉住）；AutoComplete 只是薄包装，无新增角色。
 *
 * 豁免 `label`（与 select/__tests__/a11y.test.ts 同款，antd 自测 a11y.test.ts
 * 的放行规则一致 —— R13「不低于 antd」）：combobox 的可访问名由
 * role=combobox + aria-* 状态承担，antd 同款不绑 <label>。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('AutoComplete', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 10,
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'label',
      reason:
        'combobox 的可访问名由 role=combobox + aria-* 状态承担（select 同款，antd a11y.test.ts 同款放行）。',
    },
  ],
});
