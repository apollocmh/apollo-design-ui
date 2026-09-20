/**
 * Vue 侧（@apollo-design/ui）的 Typography 视觉用例。
 *
 * 与 `render/cases/react/typography.jsx` **逐条对应**：同名、同 props 语义、同文案。
 * 用 `h()` 而不是 SFC：用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照，
 * 也不会被 SFC 编译器对 `VNodeChild` prop 的处理干扰（见 COMPATIBILITY.md D21）。
 *
 * ⚠️ 这里刻意用 `Typography.Text` 这种**复合组件挂载**形态（而不是具名 `Text`），
 *    与 React 侧逐字对应。两者指向同一个组件对象（见 `typography/index.ts`），
 *    但「挂载路径」本身也是契约的一部分。
 *
 * ⚠️ `style` 值全部写成字符串，理由见 React 侧的文件头（单位补全的平台差异）。
 */

import { Typography } from '@apollo-design/ui';
import { h } from 'vue';

import {
  TYPOGRAPHY_COLUMN_STYLE,
  TYPOGRAPHY_ELLIPSIS_BOX_STYLE,
  TYPOGRAPHY_ROW_STYLE,
  TYPOGRAPHY_SEMANTIC_CLASSNAMES,
  TYPOGRAPHY_SEMANTIC_STYLES,
  TYPOGRAPHY_TEXT,
} from '../shared.mjs';

const { Text, Title, Paragraph, Link } = Typography;

const T = TYPOGRAPHY_TEXT;
/** 七个装饰标签共用同一段文案，理由见 React 侧。 */
const D = T.decoration;

/** 默认插槽的内容 —— Vue 里 children 走插槽。 */
const slot = (text) => ({ default: () => text });

/** 没有文字、只负责排布的盒子。 */
const box = (style, children) => h('div', { style }, children);

export default {
  // ---- 1. Text：基础 + 四种语义色 + disabled -----------------------------
  text: () =>
    box(TYPOGRAPHY_COLUMN_STYLE, [
      box(TYPOGRAPHY_ROW_STYLE, [
        h(Text, null, slot(T.base)),
        h(Text, { type: 'secondary' }, slot(T.secondary)),
        h(Text, { type: 'success' }, slot(T.success)),
        h(Text, { type: 'warning' }, slot(T.warning)),
        h(Text, { type: 'danger' }, slot(T.danger)),
      ]),
      box(TYPOGRAPHY_ROW_STYLE, [
        h(Text, null, slot(T.base)),
        h(Text, { disabled: true }, slot(T.disabled)),
      ]),
    ]),

  // ---- 2. Title：h1 ~ h5 五级 ---------------------------------------------
  title: () => [
    h(Title, { level: 1 }, slot(T.title)),
    h(Title, { level: 2 }, slot(T.title)),
    h(Title, { level: 3 }, slot(T.title)),
    h(Title, { level: 4 }, slot(T.title)),
    h(Title, { level: 5 }, slot(T.title)),
  ],

  // ---- 3. Paragraph：默认 + 多段（`div&` 的 margin-bottom）-----------------
  paragraph: () => [
    h(Paragraph, null, slot(T.lorem)),
    h(Paragraph, null, slot(T.lorem)),
    h(Paragraph, { type: 'secondary' }, slot(T.lorem)),
  ],

  // ---- 4. 七个装饰标签 + 一次全叠加 --------------------------------------
  decorations: () =>
    box(TYPOGRAPHY_COLUMN_STYLE, [
      box(TYPOGRAPHY_ROW_STYLE, [
        h(Text, { code: true }, slot(D)),
        h(Text, { mark: true }, slot(D)),
        h(Text, { underline: true }, slot(D)),
        h(Text, { delete: true }, slot(D)),
        h(Text, { strong: true }, slot(D)),
        h(Text, { keyboard: true }, slot(D)),
        h(Text, { italic: true }, slot(D)),
      ]),
      box(TYPOGRAPHY_ROW_STYLE, [
        h(
          Text,
          {
            strong: true,
            underline: true,
            delete: true,
            code: true,
            mark: true,
            keyboard: true,
            italic: true,
          },
          slot(D),
        ),
      ]),
    ]),

  // ---- 5. Link：默认 / 语义色 / disabled / target=_blank ------------------
  link: () =>
    box(TYPOGRAPHY_COLUMN_STYLE, [
      box(TYPOGRAPHY_ROW_STYLE, [
        h(Link, { href: '#demo' }, slot(T.link)),
        h(Link, { href: '#demo', type: 'secondary' }, slot(T.secondary)),
        h(Link, { href: '#demo', type: 'danger' }, slot(T.danger)),
      ]),
      box(TYPOGRAPHY_ROW_STYLE, [
        h(Link, { href: '#demo', disabled: true }, slot(T.disabled)),
        h(Link, { href: '#demo', target: '_blank' }, slot(T.link)),
      ]),
    ]),

  // ---- 6. ellipsis：单行 / 多行 / 可展开 ----------------------------------
  ellipsis: () =>
    box(TYPOGRAPHY_ELLIPSIS_BOX_STYLE, [
      h(Paragraph, { ellipsis: true }, slot(T.ellipsis)),
      h(Paragraph, { ellipsis: { rows: 2 } }, slot(T.ellipsis)),
      h(Paragraph, { ellipsis: { rows: 2, expandable: 'collapsible' } }, slot(T.ellipsis)),
    ]),

  // ---- 7. copyable：复制按钮（未复制态）-----------------------------------
  copyable: () =>
    box(TYPOGRAPHY_COLUMN_STYLE, [
      h(Paragraph, { copyable: true }, slot(T.copyable)),
      h(Text, { copyable: true }, slot(T.copyable)),
    ]),

  // ---- 8. 语义化 classNames / styles -------------------------------------
  semantic: () =>
    box(TYPOGRAPHY_ELLIPSIS_BOX_STYLE, [
      h(
        Paragraph,
        {
          classNames: TYPOGRAPHY_SEMANTIC_CLASSNAMES,
          styles: TYPOGRAPHY_SEMANTIC_STYLES,
          ellipsis: { rows: 2, expandable: 'collapsible' },
        },
        slot(T.ellipsis),
      ),
    ]),
};
