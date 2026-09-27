/**
 * Vue 侧（@apollo-design/ui）的 Rate 视觉用例。与 react/rate.jsx 逐条对应。
 * basic（默认尺寸 + 状态）/ half（半星）/ character（C8-R2：#character 插槽）。
 */

import { Rate } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { minHeight: '80px', padding: '16px', width: '480px' } }, children);

export default {
  basic: () =>
    box(
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
        h(Rate, { defaultValue: 3 }),
        h(Rate, { defaultValue: 5, disabled: true }),
      ]),
    ),

  half: () => box(h(Rate, { defaultValue: 2.5, allowHalf: true })),

  character: () =>
    box(
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
        h(Rate, { defaultValue: 3 }, { character: () => 'A' }),
        h(Rate, { defaultValue: 2 }, { character: () => '好' }),
      ]),
    ),
};
