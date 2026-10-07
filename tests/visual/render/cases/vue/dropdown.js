/**
 * Vue 侧（@apollo-design/ui）的 Dropdown 视觉用例。与 react/dropdown.jsx 逐条对应。
 */

import { Button, Dropdown } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '280px', padding: '16px', width: '420px' } }, children);

const menu = {
  items: [
    { key: '1', label: 'One' },
    { key: '2', label: 'Two', danger: true },
    { key: '3', label: 'Three', disabled: true },
  ],
};

export default {
  basicOpen: () =>
    box(
      h(
        Dropdown,
        { menu, open: true, placement: 'bottom', autoAdjustOverflow: false },
        { default: () => h(Button, null, () => 'Hover me') },
      ),
    ),

  arrow: () =>
    box(
      h(
        Dropdown,
        { menu, open: true, placement: 'bottom', autoAdjustOverflow: false, arrow: true },
        { default: () => h(Button, null, () => 'Arrow') },
      ),
    ),

  /** 与 react/dropdown.jsx 的 `buttonIcon` 逐条对应 —— 理由见那边（那条 CSS 唯一的执行证据）。 */
  buttonIcon: () =>
    box(
      h(
        Dropdown,
        { menu, open: true, placement: 'bottom', autoAdjustOverflow: false },
        {
          default: () =>
            h(Button, null, () => [
              'Trigger ',
              h('span', { class: 'apollo-icon apollo-icon-down' }, '↓'),
            ]),
        },
      ),
    ),
};
