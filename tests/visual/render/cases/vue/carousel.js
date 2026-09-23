/**
 * Vue 侧（@apollo-design/ui）的 Carousel 视觉用例。与 react/carousel.jsx 逐条对应。
 *
 * ⚠️ slide 内容用两侧逐字相同的内联样式（含颜色 —— 视觉是像素比对，颜色必须一致）。
 *    autoplay 不进静态帧（时刻不确定），见 matrix.mjs 的 LIMITATIONS `carousel·motion`。
 */

import { Carousel } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '240px', padding: '16px' } }, children);

const slide = (n, bg) =>
  h('div', { key: n }, [
    h(
      'h3',
      {
        style: {
          height: '160px',
          color: '#fff',
          lineHeight: '160px',
          textAlign: 'center',
          background: bg,
        },
      },
      `${n}`,
    ),
  ]);

const slides = () => [slide(1, '#364d79'), slide(2, '#626c91'), slide(3, '#1677ff')];

export default {
  basic: () =>
    box(h('div', { style: { width: '480px' } }, [h(Carousel, null, { default: () => slides() })])),

  fade: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Carousel, { effect: 'fade' }, { default: () => slides() }),
      ]),
    ),

  arrows: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Carousel, { arrows: true }, { default: () => slides() }),
      ]),
    ),

  vertical: () =>
    box(
      h('div', { style: { width: '480px' } }, [
        h(Carousel, { dotPlacement: 'start' }, { default: () => slides() }),
      ]),
    ),
};
