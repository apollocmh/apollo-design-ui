/**
 * Vue 侧（@apollo-design/ui）的 Checkbox 视觉用例。与 react/checkbox.jsx 逐条对应。
 */

import { Checkbox, Divider } from '@apollo-design/ui';
import { h } from 'vue';

const { Group } = Checkbox;

const box = (children) => h('div', { style: { minHeight: '120px', padding: '16px' } }, children);
const item = (label, props = {}) => h(Checkbox, props, { default: () => label });

export default {
  basic: () => [
    box([
      item('Checkbox'),
      item('Checked', { defaultChecked: true }),
      item('Disabled', { disabled: true }),
      item('Checked + Disabled', { defaultChecked: true, disabled: true }),
    ]),
  ],

  indeterminate: () => [
    box([
      item('Indeterminate', { indeterminate: true }),
      item('Indeterminate + Checked', { indeterminate: true, checked: true }),
      item('Indeterminate + Disabled', { indeterminate: true, disabled: true }),
    ]),
  ],

  group: () => [
    box([
      h(Group, { options: ['Apple', 'Pear', 'Orange'], defaultValue: ['Apple'] }),
      h('br'),
      h('br'),
      h(Group, {
        options: [
          { label: 'Apple', value: 'Apple' },
          { label: 'Pear', value: 'Pear', disabled: true },
        ],
        defaultValue: ['Pear'],
      }),
      h('br'),
      h('br'),
      h(Group, { options: ['A', 'B'], disabled: true, defaultValue: ['A'] }),
    ]),
  ],

  'check-all': () => [
    box([
      item('Check all', { indeterminate: true, checked: false }),
      h(Divider),
      h(Group, { options: ['Apple', 'Pear', 'Orange'], defaultValue: ['Apple', 'Orange'] }),
    ]),
  ],

  semantic: () => [
    box(
      item('Semantic', {
        classNames: { root: 'demo-cb-root', label: 'demo-cb-label' },
        styles: { icon: { borderRadius: '50%' } },
      }),
    ),
  ],
};
