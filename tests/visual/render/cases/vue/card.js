/**
 * Vue 侧（@apollo-design/ui）的 Card 视觉用例。与 `react/card.jsx` 逐条对应。
 *
 * ⚠️ 本文件**不需要 `getPopupContainer`** —— Card 没有浮层
 * （`tabs` 变体的页签浮层在静态帧里不展开、不 portal）。
 *
 * ⚠️ 两条必须与 React 侧逐字相同的约定（理由见 `react/card.jsx` 的文件头）：
 * **容器宽度 320px** + **字体在用例内钉住**（正文不换行是前提，不是巧合）。
 *
 * ⚠️ 所有 vnode **在用例函数内新建**（vnode 是一次性的 —— 复用同一个实例会撞
 * 「VNode is already mounted」）。
 *
 * ⚠️ `Card.Grid` / `Card.Meta` 用的是**具名导出** `CardGrid` / `CardMeta`
 * （与 `Card.Grid` 指向同一对象，`-contain-grid` 的 vnode 身份比较才成立）。
 */

import { Card, CardGrid, CardMeta, ConfigProvider } from '@apollo-design/ui';
import { h } from 'vue';
import {
  CARD_AVATAR_STYLE,
  CARD_BOX_STYLE,
  CARD_COVER_STYLE,
  CARD_GRID_STYLE,
  CARD_META_DESCRIPTION,
  CARD_META_TITLE,
  CARD_PARAGRAPH_STYLE,
  CARD_SEMANTIC_CLASS_NAMES,
  CARD_SEMANTIC_STYLES,
  CARD_TAB_LIST,
} from '../shared.mjs';

const box = (children) => h('div', { style: CARD_BOX_STYLE }, [children]);

const para = (text) => h('p', { style: CARD_PARAGRAPH_STYLE }, text);

/** 正文（两侧同一份文案与结构）。⚠️ 每次调用**新建** vnode。 */
const body = () => [para('Card content'), para('Card content')];

const more = () => h('a', { href: '#more' }, 'More');

export default {
  /** head（title + extra）+ body。 */
  basic: () => box(h(Card, { title: 'Card title', extra: more() }, { default: body })),

  /** `actions` ⇒ `<ul>` + 每项 `<li><span>`，`li` 宽度是内联 `33.33…%`。 */
  actions: () =>
    box(
      h(
        Card,
        {
          title: 'Card title',
          actions: [
            h('span', null, 'Action A'),
            h('span', null, 'Action B'),
            h('span', null, 'Action C'),
          ],
        },
        { default: body },
      ),
    ),

  /** `size="small"` ⇒ head 的 min-height / padding / font-size 三条覆盖 + body padding。 */
  small: () =>
    box(h(Card, { size: 'small', title: 'Card title', extra: more() }, { default: body })),

  /** `variant="borderless"` ⇒ 没有 `-bordered`，改用 `boxShadowTertiary`。 */
  borderless: () => box(h(Card, { variant: 'borderless', title: 'Card title' }, { default: body })),

  /** `type="inner"` ⇒ head 背景变 `colorFillAlter`、字号降一档。 */
  inner: () =>
    box(
      h(
        Card,
        { title: 'Card title' },
        {
          default: () => [
            h(
              Card,
              { type: 'inner', title: 'Inner Card title', extra: more() },
              {
                default: () => 'Inner Card content',
              },
            ),
          ],
        },
      ),
    ),

  /** `loading` ⇒ body 里是 Skeleton（4 行段落，`title={false}`）。 */
  loading: () => box(h(Card, { loading: true, title: 'Card title' }, { default: body })),

  /** `Card.Grid` ⇒ `-contain-grid`（body 变 flex wrap + 负 margin）+ 网格的五段 box-shadow。 */
  grid: () =>
    box(
      h(
        Card,
        { title: 'Card Title' },
        {
          default: () =>
            Array.from({ length: 6 }, (_, i) =>
              h(CardGrid, { key: i, style: CARD_GRID_STYLE }, { default: () => 'Content' }),
            ),
        },
      ),
    ),

  /** `cover` + `Card.Meta`（avatar / title / description）。 */
  meta: () =>
    box(
      h(
        Card,
        { cover: h('div', { style: CARD_COVER_STYLE }) },
        {
          default: () => [
            h(CardMeta, {
              avatar: h('div', { style: CARD_AVATAR_STYLE }),
              title: CARD_META_TITLE,
              description: CARD_META_DESCRIPTION,
            }),
          ],
        },
      ),
    ),

  /** `tabList` ⇒ head 里的 Tabs（**全局** `.apollo-tabs-top` 规则 + `-contain-tabs` 的 padding）。 */
  tabs: () =>
    box(
      h(
        Card,
        {
          title: 'Card title',
          extra: more(),
          tabList: CARD_TAB_LIST,
          tabBarExtraContent: more(),
        },
        { default: body },
      ),
    ),

  /** 语义化 7 槽（`styles` 用**肉眼可见**的值，否则与 `basic` 逐字节相同）。 */
  semantic: () =>
    box(
      h(
        Card,
        {
          title: 'Card title',
          extra: more(),
          classNames: CARD_SEMANTIC_CLASS_NAMES,
          styles: CARD_SEMANTIC_STYLES,
        },
        { default: body },
      ),
    ),

  /** RTL：根上多 `-rtl` 类，样式里**真的**有 `direction: rtl`（与 anchor 不同）。 */
  rtl: () =>
    h(
      ConfigProvider,
      { direction: 'rtl' },
      {
        default: () => box(h(Card, { title: 'Card title', extra: more() }, { default: body })),
      },
    ),
};
