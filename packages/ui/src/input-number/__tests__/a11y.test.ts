/**
 * L5 · 无障碍 —— `role="spinbutton"` + `aria-valuemin/max/now`；
 * 步进按钮 `role="button"` + aria-label（Increase/Decrease Value）+ aria-disabled。
 * axe 扫全部 12 个 demo。
 *
 * 按可访问名称分组，豁免仅限仍缺名称的 demo：
 * 有 placeholder 或 aria-label 的 demo 不触发 axe 的 label 规则，
 * 无 placeholder 的 demo 触发 ⇒ 豁免只能挂在后者。
 *
 * 豁免登记（UPSTREAM）：input 无关联 label —— 组件本体与 antd 6.6.4 原样一致
 * （上游 a11y 测试同样禁用 label 规则）。可访问名由使用方提供，对齐 antd。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';

const LABEL_ALLOWANCE = {
  rule: 'label',
  reason:
    'antd 的 InputNumber input 无关联 label（上游 a11y 测试同样禁用 label 规则）。可访问名由使用方提供，对齐 antd，豁免该规则。',
  deviationId: 'U12',
};

a11yDemoTest('InputNumber（无 placeholder）', {
  demos: import.meta.glob(
    '../demo/{basic,disabled,digit,formatter,keyboard,out-of-range,spinner,style-class}.vue',
    {
      eager: true,
    },
  ),
  expectCount: 8,
  allow: [LABEL_ALLOWANCE],
});

a11yDemoTest('InputNumber（有可访问名称）', {
  demos: import.meta.glob('../demo/{size,variant,status,presuffix}.vue', { eager: true }),
  expectCount: 4,
});
