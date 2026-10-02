/**
 * List 的公共导出。
 *
 * 与 antd 的 `es/list/index.js` 对齐的对外面：
 *   - 默认导出 `List`（含 `Item` 静态子组件）
 *   - `Item` 同时提供**具名导出**，且它自己含 `Meta` 静态子组件
 *   - 全部类型 + 样式生成函数 + Component Token
 *
 * ── 与 antd 的**形态**差异（PLATFORM，不是行为差异）────────────────────────────
 *
 * antd 用 `List.Item = Item` / `Item.Meta = Meta` 这种「函数组件挂属性」做复合组件；
 * Vue 里对应 `Object.assign(组件, { ... })`。两者可观测行为一致：
 * `<List.Item.Meta>`（JSX）与 `<ListItemMeta>` / `<AListItemMeta>` 渲染同一棵 DOM。
 * ⚠️ `Object.assign` 而不是「先声明再赋值」—— `Object.assign` 的返回值是交叉类型，
 * 静态属性在**类型层**才可见（裸赋值不更新类型，下游会报 TS2339）。
 * 与 `Avatar.Group` / `Skeleton` / `Space` / `Card` 同一条。
 */

import { withInstall } from '../_internal/with-install';
import ItemComponent from './Item.vue';
import ItemMetaComponent from './ItemMeta.vue';
import ListComponent from './List.vue';

/** `List.Item.Meta`。注册名 `AListItemMeta`。 */
export const ListItemMeta = withInstall(ItemMetaComponent);

/** `List.Item`。注册名 `AListItem`。⚠️ 静态子组件 `Meta` 与具名导出指向**同一个对象**。 */
export const ListItem = withInstall(
  Object.assign(ItemComponent, {
    Meta: ListItemMeta,
  }),
);

/** List 复合组件。注册名 `AList`。⚠️ 静态子组件 `Item` 与具名导出指向**同一个对象**。 */
export const List = withInstall(
  Object.assign(ListComponent, {
    Item: ListItem,
  }),
);

export default List;

export type {
  ColumnCount,
  ColumnType,
  ListConfig,
  ListConsumerProps,
  ListGridType,
  ListItemLayout,
  ListItemMetaProps,
  ListItemMetaRef,
  ListItemMetaSlot,
  ListItemProps,
  ListItemSemanticClassNames,
  ListItemSemanticName,
  ListItemSemanticStyles,
  ListItemSlot,
  ListLocale,
  ListProps,
  ListRef,
  ListSize,
  ListSlot,
} from './interface';
export { genListStyle, genTokenDecls as genListTokenDecls } from './style';
export type { ComponentToken as ListComponentToken } from './style/token';
export { prepareComponentToken as prepareListComponentToken } from './style/token';
