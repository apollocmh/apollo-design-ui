/**
 * Vue 侧（@apollo-design/ui）的 Slider 视觉用例。与 react/slider.jsx 逐条对应。
 *
 * ⚠️ 两侧都不传 `prefixCls`：各自加载自己的 CSS（antd 的 CSS-in-JS / 本仓的 `style.css`），
 *    像素比对的是渲染结果，不是类名。
 */

import { Slider } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) =>
  h('div', { style: { padding: '16px', background: '#fff', width: '320px' } }, children);

export default {
  basic: () => box(h(Slider, { defaultValue: 30 })),

  range: () => box(h(Slider, { range: true, defaultValue: [20, 60] })),

  marks: () =>
    box(
      h(Slider, {
        defaultValue: 30,
        marks: {
          0: '0°C',
          26: '26°C',
          37: '37°C',
          100: { style: { color: '#f50' }, label: h('b', null, '100°C') },
        },
      }),
    ),

  dots: () => box(h(Slider, { defaultValue: 30, step: 10, dots: true })),

  vertical: () =>
    box(
      h('div', { style: { height: '200px', display: 'flex', justifyContent: 'center' } }, [
        h(Slider, {
          vertical: true,
          defaultValue: 40,
          marks: { 0: '0', 50: '50', 100: '100' },
        }),
      ]),
    ),

  reverse: () => box(h(Slider, { reverse: true, defaultValue: 40 })),

  disabled: () => box(h(Slider, { disabled: true, defaultValue: 30 })),

  includedOff: () => box(h(Slider, { included: false, defaultValue: 70 })),
};
