/**
 * Vue 侧（@apollo-design/ui）的 Breadcrumb 视觉用例。与 `react/breadcrumb.jsx` 逐条对应。
 *
 * ⚠️ 与其它组件不同，本文件**不需要 `getPopupContainer`** —— Breadcrumb 没有浮层
 * （`menu` 项虽然用 Dropdown，但静态帧里浮层不展开、不 portal）。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定（理由见 `react/breadcrumb.jsx` 的文件头）：
 * **容器宽度 320px** + **字体在用例内钉住**（内容不换行是前提，不是巧合）。
 *
 * ⚠️ 图标用 `BREADCRUMB_ICON_*` 的**同一份内联 `<svg>` 替身**（见 React 侧说明）；
 * 且 vnode **在用例函数内新建**（vnode 是一次性的 —— 复用同一个实例会撞
 * 「VNode is already mounted」）。
 */

import { Breadcrumb, ConfigProvider } from '@apollo-design/ui';
import { h } from 'vue';
import {
  BREADCRUMB_BOX_STYLE,
  BREADCRUMB_ICON_ITEMS,
  BREADCRUMB_ICON_PATH,
  BREADCRUMB_ICON_SVG_PROPS,
  BREADCRUMB_ITEMS,
  BREADCRUMB_MENU_ITEMS,
  BREADCRUMB_PARAMS,
  BREADCRUMB_PATH_ITEMS,
  BREADCRUMB_SEPARATOR_ITEMS,
} from '../shared.mjs';

const box = (children) => h('div', { style: BREADCRUMB_BOX_STYLE }, [children]);

/** 「图标 + 文字」的 title（两侧同一份结构）。⚠️ 每次调用**新建** vnode。 */
const iconTitle = (text) => [
  h('svg', { 'aria-hidden': 'true', ...BREADCRUMB_ICON_SVG_PROPS }, [
    h('path', { d: BREADCRUMB_ICON_PATH }),
  ]),
  h('span', null, text),
];

export default {
  /** 3 项：前两项 `<a href>`、末项 `<span>`；默认分隔符 `/`。 */
  basic: () => box(h(Breadcrumb, { items: BREADCRUMB_ITEMS })),

  /** 每项「裸 svg + span」⇒ 命中 `-link > svg` 与 `> svg + span` 两条规则。 */
  'with-icon': () =>
    box(
      h(Breadcrumb, {
        items: BREADCRUMB_ICON_ITEMS.map((item) => ({
          ...item,
          title: iconTitle(item.title),
        })),
      }),
    ),

  /** `separator` prop 覆盖默认值。 */
  separator: () => box(h(Breadcrumb, { separator: '>', items: BREADCRUMB_ITEMS })),

  /** `type: 'separator'` 的显式分隔符 ⇒ 与「注入的分隔符」并存。 */
  'separator-item': () => box(h(Breadcrumb, { items: BREADCRUMB_SEPARATOR_ITEMS })),

  /** `params`：`title` 里的 `:id` 被替换成 `7`（`List :id` → `List 7`，**像素可见**）。 */
  'with-params': () =>
    box(h(Breadcrumb, { params: BREADCRUMB_PARAMS, items: BREADCRUMB_PATH_ITEMS })),

  /** 带 `menu` 的项 ⇒ Dropdown 包一层 `-overlay-link` + 渲染 `dropdownIcon`。 */
  overlay: () => box(h(Breadcrumb, { items: BREADCRUMB_MENU_ITEMS })),

  /** 语义化三槽（`root` / `item` / `separator`）。 */
  semantic: () =>
    h('div', { style: { ...BREADCRUMB_BOX_STYLE, minHeight: '40px' } }, [
      h(Breadcrumb, {
        items: BREADCRUMB_ITEMS,
        classNames: {
          root: 'demo-breadcrumb-root',
          item: 'demo-breadcrumb-item',
          separator: 'demo-breadcrumb-separator',
        },
        styles: { root: { background: '#fafafa' } },
      }),
    ]),

  /** RTL：根上会多 `-rtl` 类，样式里**真的**有 `direction: rtl`（与 anchor 不同）。 */
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      { default: () => box(h(Breadcrumb, { items: BREADCRUMB_ITEMS })) },
    ),
};
