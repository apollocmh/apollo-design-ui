/**
 * Vue 侧（@apollo-design/ui）的 Spin 视觉用例。
 *
 * 与 `render/cases/react/spin.jsx` **逐条对应**。用 `h()` 而不是 SFC：
 * 用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照，
 * 也不会被 SFC 编译器对 `VNodeChild` prop 的处理干扰（见 COMPATIBILITY.md D9）。
 *
 * ⚠️ 嵌套用法在 Vue 侧是**默认插槽**，所以 children 走 `h(Spin, props, { default })`，
 *    这与 antd 的 JSX children 是同一语义（规则 C19），不是两种写法。
 */

import { Spin } from '@apollo-design/ui';
import { h } from 'vue';

import {
  SPIN_CONTENT_STYLE,
  SPIN_FULLSCREEN_BOX_STYLE,
  SPIN_PERCENT,
  SPIN_ROW_STYLE,
  SPIN_SEMANTIC_CLASSNAMES,
  SPIN_SEMANTIC_STYLES,
  SPIN_TEXT,
} from '../shared.mjs';

/** 自定义指示器：与 React 侧**逐属性一致**的内联 SVG（不依赖图标库）。 */
const indicator = h(
  'svg',
  {
    width: '1em',
    height: '1em',
    viewBox: '0 0 24 24',
    fill: 'none',
    focusable: 'false',
    'aria-hidden': 'true',
  },
  [
    h('circle', {
      cx: '12',
      cy: '12',
      r: '9',
      stroke: 'currentColor',
      'stroke-width': '3',
      'stroke-linecap': 'round',
      'stroke-dasharray': '42 14',
    }),
  ],
);

const content = () => h('div', { style: SPIN_CONTENT_STYLE }, SPIN_TEXT.title);

/** 三尺寸并排的小工具。 */
const row = (children) => h('div', { style: SPIN_ROW_STYLE }, children);

export default {
  // ⚠️ 用 `<div>` 包一层：与 react/spin.jsx 同源 —— 非嵌套 Spin 的根是
  // `display: inline-flex`，`#stage` 高度依赖 html 的 line-height，两侧 base
  // CSS 在 `html { line-height }` 上不一致会导致 1px 漂移。包 block div 后
  // 两边行盒都被吃成内容高度。详见 react/spin.jsx 的注释。
  basic: () => h('div', { style: { lineHeight: 0 } }, [h(Spin)]),

  size: () =>
    row([h(Spin, { size: 'small' }), h(Spin, { size: 'medium' }), h(Spin, { size: 'large' })]),

  description: () =>
    row([
      h(Spin, { size: 'small', description: SPIN_TEXT.description }, { default: content }),
      h(Spin, { description: SPIN_TEXT.description }, { default: content }),
      h(Spin, { size: 'large', description: SPIN_TEXT.description }, { default: content }),
    ]),

  nested: () =>
    row([
      // 转（指示器 + 文案 + 被遮住的内容）
      h(Spin, { description: SPIN_TEXT.description }, { default: content }),
      // 不转（内容正常显示，指示器整体不渲染）
      h(Spin, { spinning: false, description: SPIN_TEXT.description }, { default: content }),
    ]),

  'custom-indicator': () =>
    row([
      h(Spin, { indicator, size: 'small' }),
      h(Spin, { indicator }),
      h(Spin, { indicator, size: 'large' }),
    ]),

  percent: () =>
    row([
      h(Spin, { percent: SPIN_PERCENT, size: 'small' }),
      h(Spin, { percent: SPIN_PERCENT }),
      h(Spin, { percent: SPIN_PERCENT, size: 'large' }),
    ]),

  // ⚠️ 外层盒子的 `transform` 给 fixed 的建立包含块 —— 理由见 shared.mjs
  fullscreen: () =>
    h('div', { style: SPIN_FULLSCREEN_BOX_STYLE }, [
      h(Spin, { fullscreen: true, description: SPIN_TEXT.description }),
    ]),

  semantic: () =>
    h(
      Spin,
      {
        classNames: SPIN_SEMANTIC_CLASSNAMES,
        styles: SPIN_SEMANTIC_STYLES,
        description: SPIN_TEXT.semantic,
      },
      { default: content },
    ),
};
