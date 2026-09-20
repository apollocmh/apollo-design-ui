/**
 * Vue 侧（@apollo-design/ui）的 Skeleton 视觉用例。
 *
 * 与 `render/cases/react/skeleton.jsx` **逐条对应**。用 `h()` 而不是 SFC：
 * 用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照，
 * 也不会被 SFC 编译器对 `VNodeChild` 的处理干扰（见 COMPATIBILITY.md D21）。
 *
 * ⚠️ 子组件一律用**复合形态**（`Skeleton.Button` / `Skeleton.Input` /
 *    `Skeleton.Avatar` / `Skeleton.Node` / `Skeleton.Image`），与 React 侧逐字同形 ——
 *    这同时验证了 `Object.assign(Skeleton, {...})` 那份静态挂载。
 *
 * ⚠️ `style` 值全部写成字符串，理由见 React 侧的文件头（单位补全的平台差异）。
 */

import { Skeleton } from '@apollo-design/ui';
import { h } from 'vue';

import {
  SKELETON_COLUMN_STYLE,
  SKELETON_NODE_CHILD_STYLE,
  SKELETON_NODE_TEXT,
  SKELETON_PARAGRAPH_WIDTHS,
  SKELETON_ROW_STYLE,
  SKELETON_SEMANTIC_CLASSNAMES,
  SKELETON_SEMANTIC_STYLES,
} from '../shared.mjs';

/** `Skeleton.Node` 插槽里的替身内容 —— 两侧同形（原生元素，不引入未落地组件）。 */
const nodeChild = () => h('span', { style: SKELETON_NODE_CHILD_STYLE }, SKELETON_NODE_TEXT);

export default {
  // ---- 1. 基本形态：三个块的真值组合 -------------------------------------
  basic: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h(Skeleton),
      h(Skeleton, { title: false }),
      h(Skeleton, { paragraph: false }),
      h(Skeleton, { title: false, paragraph: false }),
    ]),

  // ---- 2. 头像：三张默认几何表 + 数字尺寸 --------------------------------
  avatar: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h(Skeleton, { avatar: true }),
      h(Skeleton, { avatar: true, paragraph: false }),
      h(Skeleton, { avatar: true, title: false }),
      h(Skeleton, { avatar: { size: 40 } }),
    ]),

  // ---- 3. round：胶囊圆角（标题与段落行的圆角换成 100px）-----------------
  round: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h(Skeleton, { round: true }),
      h(Skeleton, { round: true, avatar: true }),
      h(Skeleton, {
        round: true,
        title: { width: '70%' },
        paragraph: { rows: 2 },
      }),
    ]),

  // ---- 4. 段落：rows / width 数组 / width 数字 / active 渐变 -------------
  paragraph: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h(Skeleton, { paragraph: { rows: 4 } }),
      h(Skeleton, { paragraph: { rows: 4, width: SKELETON_PARAGRAPH_WIDTHS } }),
      h(Skeleton, { paragraph: { rows: 2, width: 120 } }),
      h(Skeleton, { active: true }),
    ]),

  // ---- 5. 标题：三张默认宽度表 + 数字 / 0 / styles 覆盖 -------------------
  title: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h(Skeleton, { title: { width: 100 } }),
      h(Skeleton, { title: { width: '70%' } }),
      h(Skeleton, { title: { width: 0 } }),
      h(Skeleton, { styles: { title: { width: '90%' } } }),
    ]),

  // ---- 6. 子组件：Button / Input / Avatar（含 block / size / shape）------
  element: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h('div', { style: SKELETON_ROW_STYLE }, [
        h(Skeleton.Button),
        h(Skeleton.Button, { size: 'small' }),
        h(Skeleton.Button, { size: 'large' }),
        h(Skeleton.Button, { shape: 'circle' }),
        h(Skeleton.Button, { shape: 'round' }),
        h(Skeleton.Button, { active: true }),
      ]),
      h('div', { style: SKELETON_ROW_STYLE }, [
        h(Skeleton.Input),
        h(Skeleton.Input, { size: 'small' }),
        h(Skeleton.Input, { size: 'large' }),
      ]),
      h('div', { style: SKELETON_ROW_STYLE }, [
        h(Skeleton.Avatar),
        h(Skeleton.Avatar, { shape: 'square' }),
        h(Skeleton.Avatar, { size: 'large' }),
        h(Skeleton.Avatar, { size: 'small' }),
      ]),
      h('div', { style: SKELETON_COLUMN_STYLE }, [
        h(Skeleton.Button, { block: true }),
        h(Skeleton.Input, { block: true }),
      ]),
    ]),

  // ---- 7. Node / Image：自定义插槽与内置占位图 ---------------------------
  'node-image': () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h('div', { style: SKELETON_ROW_STYLE }, [
        h(Skeleton.Node, null, { default: nodeChild }),
        h(Skeleton.Node, { active: true }, { default: nodeChild }),
        h(Skeleton.Image),
      ]),
      h(Skeleton.Image, { style: { width: '200px', height: '200px' } }),
    ]),

  // ---- 8. 语义化 classNames / styles -------------------------------------
  semantic: () =>
    h('div', { style: SKELETON_COLUMN_STYLE }, [
      h(Skeleton, {
        avatar: true,
        classNames: SKELETON_SEMANTIC_CLASSNAMES,
        styles: SKELETON_SEMANTIC_STYLES,
      }),
    ]),
};
