/**
 * L5 · 无障碍 —— axe 扫全部 demo + combobox 模式的 aria 约定由唯一的
 * `<input role="combobox">` 承担（L1/L4 已钉住属性面）。
 *
 * 豁免两条（与 antd 自测 `components/select/__tests__/a11y.test.ts:3` 的放行
 * 规则一致 —— R13 的判据是「不低于 antd」，antd 自身就这么放行的）：
 * - `label`：combobox 的可访问名由 `role=combobox` + `aria-*` 状态承担，
 *   antd 同款不绑 `<label>`；
 * - `button-name`：清除按钮带 `aria-label="Clear"`，但 `TransBtn` 内层是
 *   装饰图标（aria-hidden），antd 同款结构。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Select', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 35,
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'label',
      reason:
        'combobox 的可访问名由 role=combobox + aria-* 状态承担（antd a11y.test.ts 同款放行）。',
    },
  ],
});
