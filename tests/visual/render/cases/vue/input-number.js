/**
 * Vue 侧的 InputNumber 视觉用例。与 react/input-number.jsx 逐条对应。
 */

import { InputNumber } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '240px', padding: '16px', fontFamily: 'sans-serif' } }, children);

const col = { display: 'flex', flexDirection: 'column', gap: '8px', width: '320px' };

export default {
  basic: () =>
    box(
      h('div', { style: col }, [
        h(InputNumber, { defaultValue: 3, min: 1, max: 10 }),
        h(InputNumber, { defaultValue: 3, size: 'large' }),
        h(InputNumber, { defaultValue: 3, size: 'small' }),
      ]),
    ),

  variants: () =>
    box(
      h('div', { style: col }, [
        h(InputNumber, { placeholder: 'outlined' }),
        h(InputNumber, { placeholder: 'filled', variant: 'filled' }),
        h(InputNumber, { placeholder: 'borderless', variant: 'borderless' }),
        h(InputNumber, { placeholder: 'underlined', variant: 'underlined' }),
      ]),
    ),

  states: () =>
    box(
      h('div', { style: col }, [
        h(InputNumber, { defaultValue: 3, disabled: true }),
        h(InputNumber, { defaultValue: 3, readOnly: true }),
        h(InputNumber, { placeholder: 'error', status: 'error' }),
        h(InputNumber, { placeholder: 'warning', status: 'warning' }),
        h(InputNumber, { value: 99, min: 1, max: 10 }),
        h(InputNumber, { mode: 'spinner', defaultValue: 3, min: 0, max: 10 }),
        h(InputNumber, { prefix: '$', suffix: 'USD', defaultValue: 1 }),
      ]),
    ),
};
