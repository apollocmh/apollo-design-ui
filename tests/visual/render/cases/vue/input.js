/**
 * Vue 侧的 Input 视觉用例。与 react/input.jsx 逐条对应。
 */

import { Input, InputOTP, InputPassword, InputSearch, TextArea } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '240px', padding: '16px', fontFamily: 'sans-serif' } }, children);

const col = { display: 'flex', flexDirection: 'column', gap: '8px', width: '320px' };

export default {
  basic: () =>
    box([
      h('div', { style: col }, [
        h(Input, { placeholder: 'default' }),
        h(Input, { placeholder: 'large', size: 'large' }),
        h(Input, { placeholder: 'small', size: 'small' }),
      ]),
    ]),

  variants: () =>
    box([
      h('div', { style: col }, [
        h(Input, { placeholder: 'outlined' }),
        h(Input, { placeholder: 'filled', variant: 'filled' }),
        h(Input, { placeholder: 'borderless', variant: 'borderless' }),
        h(Input, { placeholder: 'underlined', variant: 'underlined' }),
      ]),
    ]),

  states: () =>
    box([
      h('div', { style: col }, [
        h(Input, { placeholder: 'disabled', disabled: true }),
        h(Input, { placeholder: 'readonly', readOnly: true }),
        h(Input, { placeholder: 'error', status: 'error' }),
        h(Input, { placeholder: 'warning', status: 'warning' }),
        h(Input, { placeholder: 'clear me', allowClear: true, defaultValue: 'clear me' }),
        h(Input, { placeholder: 'count', showCount: true, maxLength: 20, defaultValue: 'abc' }),
        h(InputPassword, { placeholder: 'password' }),
        h(TextArea, { placeholder: 'textarea', rows: 2 }),
      ]),
    ]),

  search: () =>
    box([
      h('div', { style: col }, [
        h(InputSearch, { placeholder: 'search' }),
        h(InputSearch, { placeholder: 'search', enterButton: true }),
        h(InputSearch, { placeholder: 'search', enterButton: 'Search' }),
        h(InputSearch, { placeholder: 'search', enterButton: true, loading: true }),
      ]),
    ]),

  otp: () =>
    box([
      h('div', { style: col }, [
        h(InputOTP),
        h(InputOTP, { defaultValue: '123' }),
        h(InputOTP, { defaultValue: '123456', separator: '-', mask: true }),
      ]),
    ]),
};
