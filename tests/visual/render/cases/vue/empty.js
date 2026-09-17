/**
 * Vue 侧（@apollo-design/ui）的 Empty 视觉用例。
 *
 * 与 `render/cases/react/empty.jsx` **逐条对应**。用 `h()` 而不是 SFC：
 * 用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照，
 * 也不会被 SFC 编译器对 `VNodeChild` prop 的处理干扰（见 COMPATIBILITY.md D9）。
 */

import { Empty, PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui';
import { h } from 'vue';

import {
  CUSTOM_IMAGE,
  FOOTER_BUTTON_STYLE,
  LABEL,
  LINK_STYLE,
  SEMANTIC_CLASSNAMES,
  SEMANTIC_STYLES,
} from '../shared.mjs';

export default {
  default: () => h(Empty),

  simple: () => h(Empty, { image: PRESENTED_IMAGE_SIMPLE }),

  'no-description': () => h(Empty, { description: false }),

  'custom-description': () =>
    h(Empty, {
      description: h('span', [
        'Customize ',
        h('a', { href: '#demo', style: LINK_STYLE }, 'this link'),
      ]),
    }),

  'custom-image': () => h(Empty, { image: CUSTOM_IMAGE, description: LABEL.customDescription }),

  'with-footer': () =>
    h(
      Empty,
      { description: LABEL.customDescription },
      {
        default: () =>
          h('button', { type: 'button', style: FOOTER_BUTTON_STYLE }, LABEL.withFooter),
      },
    ),

  semantic: () =>
    h(Empty, {
      image: PRESENTED_IMAGE_SIMPLE,
      classNames: SEMANTIC_CLASSNAMES,
      styles: SEMANTIC_STYLES,
      description: LABEL.semantic,
    }),
};
