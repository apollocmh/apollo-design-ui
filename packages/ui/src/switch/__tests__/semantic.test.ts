/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Switch
 *
 * 基准：`tests/compat/baselines/switch.dom.json`（机械 oracle，20 个用例）。
 * `keepStyle: true`。`checked` / `disabled` / `autofocus` 等**原生属性**不进
 * `contract` 档（T10 只保留 tag / class / role / aria-* / data-*）——
 * `aria-checked` 进契约（它是 aria-*），键盘/点击行为由 L1 钉。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/switch.dom.json';
import { Switch } from '../index';

const BP = { prefixCls: 'apollo-switch' };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'switch:no-props': { render: () => h(Switch, BP) },
  'switch:default-checked': { render: () => h(Switch, { ...BP, defaultChecked: true }) },
  'switch:checked': { render: () => h(Switch, { ...BP, checked: true }) },
  'switch:disabled': { render: () => h(Switch, { ...BP, disabled: true }) },
  'switch:checked-disabled': {
    render: () => h(Switch, { ...BP, checked: true, disabled: true }),
  },

  'switch:value-alias': { render: () => h(Switch, { ...BP, value: true }) },
  'switch:default-value-alias': { render: () => h(Switch, { ...BP, defaultValue: true }) },

  'switch:loading': { render: () => h(Switch, { ...BP, loading: true }) },
  'switch:loading-checked': { render: () => h(Switch, { ...BP, loading: true, checked: true }) },
  'switch:loading-small': { render: () => h(Switch, { ...BP, loading: true, size: 'small' }) },

  'switch:size-small': { render: () => h(Switch, { ...BP, size: 'small' }) },
  'switch:size-medium': { render: () => h(Switch, { ...BP, size: 'medium' }) },
  'switch:size-default-deprecated': { render: () => h(Switch, { ...BP, size: 'default' }) },

  'switch:children-string': {
    render: () => h(Switch, { ...BP, checkedChildren: 'On', unCheckedChildren: 'Off' }),
  },
  'switch:children-string-checked': {
    render: () =>
      h(Switch, { ...BP, checkedChildren: 'On', unCheckedChildren: 'Off', checked: true }),
  },
  'switch:children-number': {
    // C8-R2：非 string 内容走 #checkedChildren / #unCheckedChildren 插槽
    render: () =>
      h(Switch, { ...BP, checked: true }, { checkedChildren: () => 1, unCheckedChildren: () => 0 }),
  },
  'switch:children-small': {
    render: () =>
      h(Switch, {
        ...BP,
        checkedChildren: 'On',
        unCheckedChildren: 'Off',
        size: 'small',
        checked: true,
      }),
  },

  'switch:attrs': {
    render: () => h(Switch, { ...BP, id: 'x', title: 't', tabIndex: 3, autoFocus: true }),
  },
  'switch:aria-data': {
    render: () => h(Switch, { ...BP, 'aria-label': 'switch', 'data-x': '1' }),
  },

  'switch:semantic': {
    render: () =>
      h(Switch, {
        ...BP,
        checkedChildren: 'On',
        unCheckedChildren: 'Off',
        checked: true,
        classNames: {
          root: 'custom-root',
          content: 'custom-content',
          indicator: 'custom-indicator',
        },
        styles: {
          root: { margin: '4px' },
          content: { fontStyle: 'italic' },
          indicator: { top: '1px' },
        },
      }),
  },
};

domContractTest('Switch', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Switch L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
