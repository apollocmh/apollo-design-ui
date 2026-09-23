/**
 * L4 · DOM 契约（与 antd 6.6.4 的实测 DOM 比对）—— Radio / RadioGroup / RadioButton
 *
 * 基准：`tests/compat/baselines/radio.dom.json`（机械 oracle，31 个用例）。
 * `keepStyle: true`。`checked` / `disabled` / `name` / `value` 这些 input 属性
 * 不进 `contract` 档（T10 只保留 tag / class / role / aria-* / data-*）——
 * 它们的语义由 L1 钉（`__tests__/index.test.ts`）。
 */

import { type DomRenderResult, domContractTest } from '@apollo-design/test-utils';
import { h } from 'vue';
import baseline from '../../../../../tests/compat/baselines/radio.dom.json';
import { Radio, RadioButton, RadioGroup } from '../index';

const BP = { prefixCls: 'apollo-radio' };

/** 用例规格表：id → Vue 侧渲染产物。必须覆盖基线里的每一个用例。 */
const specs: Record<string, { render: () => DomRenderResult }> = {
  'radio:no-props': { render: () => h(Radio, BP) },
  'radio:children': { render: () => h(Radio, BP, { default: () => 'label text' }) },
  'radio:default-checked': {
    render: () => h(Radio, { ...BP, defaultChecked: true }, { default: () => 'x' }),
  },
  'radio:checked': { render: () => h(Radio, { ...BP, checked: true }, { default: () => 'x' }) },
  'radio:disabled': { render: () => h(Radio, { ...BP, disabled: true }, { default: () => 'x' }) },
  'radio:checked-disabled': {
    render: () => h(Radio, { ...BP, checked: true, disabled: true }, { default: () => 'x' }),
  },
  'radio:value': { render: () => h(Radio, { ...BP, value: 'a' }, { default: () => 'x' }) },
  'radio:attrs': {
    render: () =>
      h(
        Radio,
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
    render: () => h(RadioGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'] }),
  },
  'group:default-value': {
    render: () =>
      h(RadioGroup, { ...BP, options: ['Apple', 'Pear', 'Orange'], defaultValue: 'Apple' }),
  },
  'group:value-controlled': {
    render: () => h(RadioGroup, { ...BP, options: ['Apple', 'Pear'], value: 'Pear' }),
  },
  'group:options-object': {
    render: () =>
      h(RadioGroup, {
        ...BP,
        options: [
          { label: 'Apple', value: 'Apple', className: 'label-1' },
          { label: 'Pear', value: 'Pear' },
        ],
      }),
  },
  'group:options-disabled': {
    render: () =>
      h(RadioGroup, {
        ...BP,
        options: [
          { label: 'Apple', value: 'Apple' },
          { label: 'Pear', value: 'Pear', disabled: true },
        ],
        disabled: false,
      }),
  },
  'group:disabled-all': {
    render: () => h(RadioGroup, { ...BP, options: ['Apple', 'Pear'], disabled: true }),
  },
  'group:number-options': {
    render: () => h(RadioGroup, { ...BP, options: [1, 2, 3], defaultValue: 2 }),
  },
  'group:name': {
    render: () => h(RadioGroup, { ...BP, options: ['Yes', 'No'], name: 'radiogroup' }),
  },
  'group:children': {
    render: () =>
      h(RadioGroup, BP, {
        default: () => [
          h(Radio, { value: 'a' }, { default: () => 'A' }),
          h(Radio, { value: 'b' }, { default: () => 'B' }),
        ],
      }),
  },
  'group:custom-role': {
    render: () => h(RadioGroup, { ...BP, options: ['A'], role: 'list' }),
  },
  'group:custom-prefix': {
    render: () => h(RadioGroup, { prefixCls: 'my-radio', options: ['A'] }),
  },
  'group:vertical': {
    render: () => h(RadioGroup, { ...BP, options: ['A', 'B'], vertical: true }),
  },
  'group:orientation-horizontal': {
    render: () =>
      h(RadioGroup, { ...BP, options: ['A', 'B'], vertical: true, orientation: 'horizontal' }),
  },
  'group:block': {
    render: () => h(RadioGroup, { ...BP, options: ['A', 'B'], block: true }),
  },
  'group:size-large': {
    render: () => h(RadioGroup, { ...BP, options: ['A'], size: 'large' }),
  },
  'group:size-small': {
    render: () => h(RadioGroup, { ...BP, options: ['A'], size: 'small' }),
  },
  'group:button-type': {
    render: () => h(RadioGroup, { ...BP, options: ['A', 'B'], optionType: 'button' }),
  },
  'group:button-solid': {
    render: () =>
      h(RadioGroup, { ...BP, options: ['A', 'B'], optionType: 'button', buttonStyle: 'solid' }),
  },
  'group:button-vertical': {
    render: () =>
      h(RadioGroup, { ...BP, options: ['A', 'B'], optionType: 'button', vertical: true }),
  },
  'group:button-disabled': {
    render: () => h(RadioGroup, { ...BP, options: ['A'], optionType: 'button', disabled: true }),
  },
  'group:radio-button-children': {
    render: () =>
      h(
        RadioGroup,
        { ...BP, optionType: 'button' },
        {
          default: () => [
            h(RadioButton, { value: 'a' }, { default: () => 'A' }),
            h(RadioButton, { value: 'b' }, { default: () => 'B' }),
          ],
        },
      ),
  },
  'group:aria-data': {
    render: () =>
      h(RadioGroup, {
        ...BP,
        options: ['A'],
        'data-radio-group-id': 'radio-group-id',
        'aria-label': 'radio-group',
      }),
  },
  'radio:semantic': {
    render: () =>
      h(
        Radio,
        {
          ...BP,
          classNames: { root: 'custom-root', icon: 'custom-icon', label: 'custom-label' },
          styles: { root: { padding: '10px' }, icon: { borderRadius: '2px' } },
        },
        { default: () => 'x' },
      ),
  },
};

domContractTest('Radio', {
  baseline,
  keepStyle: true,
  allow: {},
  render: (id) => {
    const spec = specs[id];
    if (!spec) throw new Error(`[Radio L4] 用例 "${id}" 缺少 Vue 侧规格 —— baseline 与 specs 失配`);
    return spec.render();
  },
});
