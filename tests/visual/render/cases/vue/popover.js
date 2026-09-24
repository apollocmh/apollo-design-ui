/**
 * Vue 侧（@apollo-design/ui）的 Popover 视觉用例。与 react/popover.jsx 逐条对应。
 */

import { Button, Popover, PopoverPurePanel } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '280px', padding: '16px', width: '420px' } }, children);

const content = () =>
  h('div', null, [
    h('p', { style: { margin: 0 } }, 'Content'),
    h('p', { style: { margin: 0 } }, 'Content'),
  ]);

export default {
  basicOpen: () =>
    box(
      h(
        Popover,
        {
          title: 'Title',
          open: true,
          placement: 'bottom',
          autoAdjustOverflow: false,
        },
        {
          default: () => h(Button, { type: 'primary' }, () => 'Hover me'),
          content,
        },
      ),
    ),

  purePanel: () =>
    box(
      h('div', { style: { padding: '16px' } }, [
        // PurePanel 走 prop 通道（antd 同款：content 是 prop）
        h(PopoverPurePanel, { title: 'Title', content: content() }),
        h(PopoverPurePanel, {
          title: 'Title',
          content: content(),
          placement: 'bottomLeft',
          style: { marginTop: '16px', width: '250px' },
        }),
      ]),
    ),
};
