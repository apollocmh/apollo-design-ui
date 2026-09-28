/**
 * L5 · 无障碍 —— axe 扫全部 demo。
 *
 * 契约：role=progressbar + aria-valuenow/min/max（主组件钉住）；≤20px circle 的
 * indicator 经 Tooltip 展示（tooltip 基线的 a11y 已覆盖）。
 *
 * 豁免 `aria-progressbar-name`（与 antd 自测 a11y.test.ts 的 disabledRules 同款，
 * R13「不低于 antd」）：progressbar 的语义经 aria-valuenow/min/max 表达，
 * antd demo 同样不绑可访问名称（可由使用方 aria-label 补充）。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';

a11yDemoTest('Progress', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 17,
  global: { stubs: { teleport: false } },
  allow: [
    {
      rule: 'aria-progressbar-name',
      reason:
        'progressbar 的语义经 aria-valuenow/min/max 表达；antd 自测同款豁免（disabledRules），可访问名由使用方 aria-label 补充。',
    },
  ],
});
