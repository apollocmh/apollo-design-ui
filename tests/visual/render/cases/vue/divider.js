/**
 * Vue 侧（@apollo-design/ui）的 Divider 视觉用例。
 *
 * 与 `render/cases/react/divider.jsx` **逐条对应**。用 `h()` 而不是 SFC：
 * 用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照，
 * 也不会被 SFC 编译器对 `VNodeChild` prop 的处理干扰（见 COMPATIBILITY.md D21）。
 *
 * ⚠️ `style` 值全部写成字符串，理由见 React 侧的文件头（单位补全的平台差异）。
 */

import { Divider } from '@apollo-design/ui';
import { h } from 'vue';

import {
  DIVIDER_CUSTOM_BORDER,
  DIVIDER_INLINE_STYLE,
  DIVIDER_LINK_STYLE,
  DIVIDER_PARAGRAPH_STYLE,
  DIVIDER_SEMANTIC_CLASSNAMES,
  DIVIDER_SEMANTIC_STYLES,
  DIVIDER_TEXT,
} from '../shared.mjs';

/** 段落 —— 与 React 侧同形。 */
const P = (text) => h('p', { style: DIVIDER_PARAGRAPH_STYLE }, text);

const link = () => h('a', { href: '#demo', style: DIVIDER_LINK_STYLE }, DIVIDER_TEXT.link);

export default {
  // ---- 1. 基本形态：水平 + 虚线 -------------------------------------------
  horizontal: () => [
    P(DIVIDER_TEXT.lorem),
    h(Divider),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { dashed: true }),
    P(DIVIDER_TEXT.lorem),
  ],

  // ---- 2. 带文字：center / start / end + styles.content.margin ------------
  'with-text': () => [
    h(Divider, null, { default: () => DIVIDER_TEXT.center }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { titlePlacement: 'start' }, { default: () => DIVIDER_TEXT.start }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { titlePlacement: 'end' }, { default: () => DIVIDER_TEXT.end }),
    P(DIVIDER_TEXT.lorem),
    h(
      Divider,
      { titlePlacement: 'start', styles: { content: { margin: '0' } } },
      { default: () => DIVIDER_TEXT.start },
    ),
    P(DIVIDER_TEXT.lorem),
    h(
      Divider,
      { titlePlacement: 'end', styles: { content: { margin: '0 50px' } } },
      { default: () => DIVIDER_TEXT.end },
    ),
  ],

  // ---- 3. 垂直：orientation 与 vertical 两条路径 --------------------------
  vertical: () =>
    h('div', { style: DIVIDER_INLINE_STYLE }, [
      DIVIDER_TEXT.inline,
      h(Divider, { orientation: 'vertical' }),
      link(),
      h(Divider, { vertical: true }),
      link(),
    ]),

  // ---- 4. 变体：solid / dotted / dashed ----------------------------------
  variant: () => [
    h(
      Divider,
      { style: { borderColor: DIVIDER_CUSTOM_BORDER } },
      { default: () => DIVIDER_TEXT.solid },
    ),
    P(DIVIDER_TEXT.lorem),
    h(
      Divider,
      { variant: 'dotted', style: { borderColor: DIVIDER_CUSTOM_BORDER } },
      { default: () => DIVIDER_TEXT.dotted },
    ),
    P(DIVIDER_TEXT.lorem),
    h(
      Divider,
      { variant: 'dashed', dashed: true, style: { borderColor: DIVIDER_CUSTOM_BORDER } },
      { default: () => DIVIDER_TEXT.dashed },
    ),
  ],

  // ---- 5. 间距大小：small / medium / large --------------------------------
  size: () => [
    P(DIVIDER_TEXT.lorem),
    h(Divider, { size: 'small' }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { size: 'medium' }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { size: 'large' }),
    P(DIVIDER_TEXT.lorem),
  ],

  // ---- 6. plain：正文样式的标题 ------------------------------------------
  plain: () => [
    h(Divider, { plain: true }, { default: () => DIVIDER_TEXT.center }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { titlePlacement: 'start', plain: true }, { default: () => DIVIDER_TEXT.start }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { titlePlacement: 'end', plain: true }, { default: () => DIVIDER_TEXT.end }),
  ],

  // ---- 7. 样式自定义：`style` 覆盖 borderColor / borderWidth -------------
  'customize-style': () => [
    h(Divider, { style: { borderWidth: '2px', borderColor: DIVIDER_CUSTOM_BORDER } }),
    P(DIVIDER_TEXT.lorem),
    h(Divider, { style: { borderColor: DIVIDER_CUSTOM_BORDER }, dashed: true }),
    P(DIVIDER_TEXT.lorem),
    h(
      Divider,
      { style: { borderColor: DIVIDER_CUSTOM_BORDER }, dashed: true },
      { default: () => DIVIDER_TEXT.center },
    ),
  ],

  // ---- 8. 语义化 classNames / styles -------------------------------------
  semantic: () => [
    h(
      Divider,
      { classNames: DIVIDER_SEMANTIC_CLASSNAMES, styles: DIVIDER_SEMANTIC_STYLES },
      { default: () => DIVIDER_TEXT.center },
    ),
    P(DIVIDER_TEXT.lorem),
    h(
      Divider,
      {
        titlePlacement: 'start',
        classNames: DIVIDER_SEMANTIC_CLASSNAMES,
        styles: DIVIDER_SEMANTIC_STYLES,
      },
      { default: () => DIVIDER_TEXT.start },
    ),
  ],
};
