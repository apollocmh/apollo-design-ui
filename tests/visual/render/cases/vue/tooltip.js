/**
 * Vue 侧（@apollo-design/ui）的 Tooltip 视觉用例。与 react/tooltip.jsx 逐条对应。
 * 两侧刻意选择（原因见 react/tooltip.jsx 文件头）：触发区用各自的 Button 组件。
 */

import { Button, Tooltip, TooltipPurePanel } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '280px', padding: '16px', width: '420px' } }, children);

export default {
  basicOpen: () =>
    box(
      h(
        Tooltip,
        { title: 'prompt text', open: true, placement: 'bottom', autoAdjustOverflow: false },
        { default: () => h(Button, null, () => 'Hover me') },
      ),
    ),

  colorful: () =>
    box(
      h('div', { style: { display: 'flex', gap: '8px' } }, [
        h(
          Tooltip,
          {
            title: 'preset',
            color: 'blue',
            open: true,
            placement: 'bottom',
            autoAdjustOverflow: false,
          },
          { default: () => h(Button, null, () => 'blue') },
        ),
        h(
          Tooltip,
          {
            title: 'custom',
            color: '#f50',
            open: true,
            placement: 'bottom',
            autoAdjustOverflow: false,
          },
          { default: () => h(Button, null, () => '#f50') },
        ),
      ]),
    ),

  purePanel: () =>
    box(
      h('div', { style: { padding: '16px' } }, [
        h(TooltipPurePanel, { title: 'Hello Pure Panel!' }),
        h(TooltipPurePanel, {
          title: 'Hello Pink!',
          color: 'pink',
          style: { marginTop: '16px' },
        }),
      ]),
    ),
};
