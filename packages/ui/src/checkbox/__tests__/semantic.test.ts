/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Checkbox
 *
 * 基准：`tests/compat/baselines/checkbox.dom.json`（机械 oracle）。
 * `keepStyle: true`。indeterminate 的 input 副作用与事件行为由 L1 覆盖。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/checkbox.dom.json';
import { Checkbox, CheckboxGroup } from '../index';

const BP = { prefixCls: 'apollo-checkbox' };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'checkbox:no-props': { render: () => h(Checkbox, BP) },
  'checkbox:children': { render: () => h(Checkbox, BP, { default: () => 'label text' }) },
  'checkbox:zero-children': { render: () => h(Checkbox, BP, { default: () => 0 }) },
  'checkbox:default-checked': {
    render: () => h(Checkbox, { ...BP, defaultChecked: true }, { default: () => 'x' }),
  },
  'checkbox:checked': {
    render: () => h(Checkbox, { ...BP, checked: true }, { default: () => 'x' }),
  },
  'checkbox:disabled': {
    render: () => h(Checkbox, { ...BP, disabled: true }, { default: () => 'x' }),
  },
  'checkbox:indeterminate': {
    render: () => h(Checkbox, { ...BP, indeterminate: true }, { default: () => 'x' }),
  },
  'checkbox:checked-disabled': {
    render: () => h(Checkbox, { ...BP, checked: true, disabled: true }, { default: () => 'x' }),
  },
  'checkbox:attrs': {
    render: () =>
      h(
        Checkbox,
        {
          ...BP,
          id: 'x',
          name: 'n',
          required: true,
          tabIndex: 3,
          autoFocus: true,
          title: 't',
        },
        { default: () => 'x' },
      ),
  },

  'group:options-string': {
    render: () => h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'] }),
  },
  'group:default-value': {
    render: () =>
      h(CheckboxGroup, {
        ...BP,
        options: ['Apple', 'Pear', 'Orange'],
        defaultValue: ['Apple'],
      }),
  },
  'group:value-controlled': {
    render: () => h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear'], value: ['Pear'] }),
  },
  'group:options-object': {
    render: () =>
      h(CheckboxGroup, {
        ...BP,
        options: [
          { label: 'Apple', value: 'Apple', className: 'label-1' },
          { label: 'Pear', value: 'Pear' },
        ],
      }),
  },
  'group:options-disabled': {
    render: () =>
      h(CheckboxGroup, {
        ...BP,
        options: [
          { label: 'Apple', value: 'Apple' },
          { label: 'Pear', value: 'Pear', disabled: true },
        ],
        disabled: false,
      }),
  },
  'group:disabled-all': {
    render: () => h(CheckboxGroup, { ...BP, options: ['Apple', 'Pear'], disabled: true }),
  },
  'group:number-options': {
    render: () => h(CheckboxGroup, { ...BP, options: [1, 2, 3], defaultValue: [2] }),
  },
  'group:name': {
    render: () => h(CheckboxGroup, { ...BP, options: ['Yes', 'No'], name: 'cbgroup' }),
  },
  'group:children': {
    render: () =>
      h(CheckboxGroup, BP, { default: () => h(Checkbox, BP, { default: () => 'child' }) }),
  },
  'group:custom-role': {
    render: () => h(CheckboxGroup, { ...BP, options: ['A'], role: 'list' }),
  },
  'group:custom-prefix': {
    render: () => h(CheckboxGroup, { prefixCls: 'my-checkbox', options: ['A'] }),
  },
  'checkbox:semantic': {
    render: () =>
      h(
        Checkbox,
        {
          ...BP,
          classNames: { root: 'custom-root', icon: 'custom-icon', label: 'custom-label' },
          styles: { root: { padding: '10px' }, icon: { borderRadius: '2px' } },
        },
        { default: () => 'x' },
      ),
  },
};

domContractTest('Checkbox', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec)
      throw new Error(`[Checkbox L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
