/**
 * Vue 侧（@apollo-design/ui）的 List 视觉用例。与 `react/list.jsx` **逐条对应**。
 *
 * ⚠️ 本文件**不需要 `getPopupContainer`** —— List 没有浮层
 * （分页不带下拉时不开浮层；`-item-action` 是行内 `<ul>`）。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定（理由见 `react/list.jsx` 的文件头）：
 * **容器宽度 320px** + **字体在用例内钉住**。
 *
 * ⚠️ 所有 vnode **在用例函数内新建**（vnode 是一次性的 —— 复用同一个实例会撞
 * 「VNode is already mounted」）。
 *
 * ⚠️ `List.Item` / `List.Item.Meta` 用**具名导出** `ListItem` / `ListItemMeta`
 * （与静态属性指向同一对象）。
 */

import { ConfigProvider, List, ListItem, ListItemMeta } from '@apollo-design/ui';
import { h } from 'vue';
import {
  LIST_AVATAR_STYLE,
  LIST_BOX_STYLE,
  LIST_DATA,
  LIST_DATA_LONG,
  LIST_DESC,
} from '../shared.mjs';

const box = (children) => h('div', { style: LIST_BOX_STYLE }, children);

const avatar = () => h('span', { style: LIST_AVATAR_STYLE });

/** 最简的字符项。 */
const textItem = (item) => h(ListItem, { key: item }, { default: () => item });

/** 带 Meta 的项（avatar + title + description）。 */
const metaItem = (item) =>
  h(
    ListItem,
    { key: item },
    {
      default: () => h(ListItemMeta, { avatar: avatar(), title: item, description: LIST_DESC }),
    },
  );

/** 带 actions 的项（`<ul>` + 每项 `<li>` + 项间 `-item-action-split`）。 */
const actionItem = (item) =>
  h(
    ListItem,
    {
      key: item,
      actions: [h('a', { key: 'edit' }, 'edit'), h('a', { key: 'more' }, 'more')],
    },
    { default: () => item },
  );

export default {
  /** `-split` 的默认分割线 + item padding。 */
  basic: () => box(h(List, { dataSource: LIST_DATA, renderItem: textItem })),

  /** `Item.Meta` 的三段（avatar / title / description）+ `h4` 标题。 */
  meta: () => box(h(List, { dataSource: LIST_DATA, renderItem: metaItem })),

  /** `-item-action` 的 `<ul>` + `<li>` + 中间那条 `-item-action-split`。 */
  actions: () => box(h(List, { dataSource: LIST_DATA, renderItem: actionItem })),

  /** `-bordered` 的外框 + header/footer 的**内圆角** + `padding-inline`。 */
  bordered: () =>
    box(
      h(List, {
        bordered: true,
        header: 'Header',
        footer: 'Footer',
        dataSource: LIST_DATA,
        renderItem: textItem,
      }),
    ),

  /** `-vertical` + `-item-main` / `-item-extra` 两段式 + `-item-extra` 的 margin。 */
  vertical: () =>
    box(
      h(List, {
        itemLayout: 'vertical',
        dataSource: LIST_DATA,
        renderItem: (item) =>
          h(
            ListItem,
            { key: item, extra: h('span', 'extra') },
            {
              default: () => h(ListItemMeta, { title: item, description: LIST_DESC }),
            },
          ),
      }),
    ),

  /** grid：`Row` + `Col` + `-grid .{antCls}-col > -item` 的 `margin-block-end`。 */
  grid: () =>
    box(
      h(List, {
        grid: { column: 2, gutter: 16 },
        dataSource: LIST_DATA_LONG,
        renderItem: textItem,
      }),
    ),

  /** 分页 + `-something-after-last-item` 的 `:last-child` 下边框。 */
  pagination: () =>
    box(
      h(List, {
        pagination: { pageSize: 2 },
        dataSource: LIST_DATA_LONG,
        renderItem: textItem,
      }),
    ),

  /** `-loading` + Spin 的嵌套容器 + 53px 占位块。 */
  loading: () => box(h(List, { loading: true, dataSource: LIST_DATA, renderItem: textItem })),

  /** `-empty-text`（默认空态）。 */
  empty: () => box(h(List)),

  /** `-lg` / `-sm` 的 item padding。 */
  size: () =>
    box([
      h(List, { size: 'large', dataSource: LIST_DATA, renderItem: textItem }),
      h(List, { size: 'small', dataSource: LIST_DATA, renderItem: textItem }),
    ]),

  /** `-rtl`（逻辑属性 `margin-inline-start` 随之翻转）。 */
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      {
        default: () =>
          box(
            h(List, {
              itemLayout: 'vertical',
              dataSource: LIST_DATA,
              renderItem: (item) =>
                h(
                  ListItem,
                  {
                    key: item,
                    actions: [h('a', { key: 'edit' }, 'edit')],
                    extra: h('span', 'extra'),
                  },
                  { default: () => item },
                ),
            }),
          ),
      },
    ),
};
