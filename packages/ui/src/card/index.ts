/**
 * Card 的公共导出。
 *
 * 与 antd 的 `es/card/index.js` 对齐的对外面：
 *   - 默认导出 `Card`（含 `Grid` / `Meta` 两个静态子组件）
 *   - 两个子组件同时提供**具名导出**（`CardGrid` / `CardMeta`）
 *   - 全部类型 + 样式生成函数 + Component Token
 *
 * ── 与 antd 的**形态**差异（PLATFORM，不是行为差异）────────────────────────────
 *
 * antd 用 `Card.Grid = CardGrid` 这种「函数组件挂属性」做复合组件；
 * Vue 里对应 `Object.assign(组件, { Grid, Meta })`。两者可观测行为一致：
 * `<Card.Grid>`（JSX）与 `<CardGrid>` / `<ACardGrid>` 渲染同一棵 DOM。
 * ⚠️ `Object.assign` 而不是「先声明再赋值」—— `Object.assign` 的返回值是交叉类型，
 * `Card.Grid` 在**类型层**才可见（裸赋值不更新类型，下游用 `Card.Grid` 会报 TS2339）。
 * 与 `Skeleton` / `Space` / `Typography` 同一条。
 *
 * ── 🚨 `Card.Grid` 的 vnode 身份是 `-contain-grid` 的判据 ─────────────────────
 *
 * `Card.vue` 的 `containsGrid()` 比的是 `child.type === CardGrid`（**本文件导出的
 * 那个 `withInstall` 包装对象**）。所以 `Object.assign` 里的 `Grid` 必须指向
 * **同一个** `CardGrid` 常量 —— 换成一个新的包装对象会让 `-contain-grid` 静默失效。
 */

import { withInstall } from '../_internal/with-install';
import CardComponent from './Card.vue';
import CardGridComponent from './CardGrid.vue';
import CardMetaComponent from './CardMeta.vue';

/** `Card.Grid`。注册名 `ACardGrid`。 */
export const CardGrid = withInstall(CardGridComponent);

/** `Card.Meta`。注册名 `ACardMeta`。 */
export const CardMeta = withInstall(CardMetaComponent);

/**
 * Card 复合组件。注册名 `ACard`。
 *
 * ⚠️ 静态子组件与具名导出指向**同一批对象**（见文件头最后一段）。
 */
export const Card = withInstall(
  Object.assign(CardComponent, {
    Grid: CardGrid,
    Meta: CardMeta,
  }),
);

export default Card;

export type {
  CardConfig,
  CardGridProps,
  CardGridRef,
  CardGridSlot,
  CardMetaConfig,
  CardMetaProps,
  CardMetaRef,
  CardMetaSemanticAllType,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles,
  CardMetaSemanticType,
  CardMetaSemanticValue,
  CardMetaSlot,
  CardProps,
  CardRef,
  CardSemanticAllType,
  CardSemanticClassNames,
  CardSemanticStyles,
  CardSemanticType,
  CardSemanticValue,
  CardSize,
  CardSlot,
  CardTabListType,
  CardType,
} from './interface';
export { genCardStyle, genTokenDecls as genCardTokenDecls } from './style';
export type { ComponentToken as CardComponentToken } from './style/token';
export { prepareComponentToken as prepareCardComponentToken } from './style/token';
