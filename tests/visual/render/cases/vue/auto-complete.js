/**
 * Vue 侧（@apollo-design/ui）的 AutoComplete 视觉用例。与 react/auto-complete.jsx 逐条对应。
 * basic（默认 + 受控值）/ status（校验状态）/ style-class（语义样式）。
 */

import { AutoComplete } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '80px', padding: '16px', width: '480px' } }, children);

const options = [{ value: 'Burnaby' }, { value: 'Seattle' }, { value: 'Los Angeles' }];

export default {
  basic: () =>
    box(
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
        h(AutoComplete, { options, placeholder: 'input here', style: { width: '200px' } }),
        h(AutoComplete, { value: 'abc', options, style: { width: '200px' } }),
      ]),
    ),

  status: () =>
    box(
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
        h(AutoComplete, { options, status: 'error', style: { width: '200px' } }),
        h(AutoComplete, { options, status: 'warning', style: { width: '200px' } }),
      ]),
    ),

  'style-class': () =>
    box(
      h(AutoComplete, {
        options,
        placeholder: 'object styles',
        style: { width: '200px' },
        styles: { popup: { root: { borderWidth: '1px', borderColor: '#1890ff' } } },
      }),
    ),
};
