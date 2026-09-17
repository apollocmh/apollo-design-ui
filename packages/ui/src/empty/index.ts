/**
 * Empty 的公共导出。
 *
 * 与 antd 的 `es/empty/index.js` 对齐的对外面：
 *   - 默认导出 `Empty`（含 `PRESENTED_IMAGE_DEFAULT` / `PRESENTED_IMAGE_SIMPLE` 两个静态属性）
 *   - 两个插画常量同时提供**具名导出**（Vue 生态的惯例，也便于 tree-shaking）
 *   - 全部类型
 *
 * ── 关于 `PRESENTED_IMAGE_*` 的形态（有意差异 D5）──────────────────────────────
 *
 * antd 里它们是 `React.createElement(DefaultEmptyImg)` 的结果 —— **模块级常量元素**，
 * 靠引用相等驱动 `-normal` 类名。Vue 侧照搬「常量 VNode」会踩到 VNode 可变的坑
 * （同一个 VNode 被两个 Empty 实例渲染时行为未定义，详见 `components/NodeRenderer.ts`）。
 *
 * 所以这里用**组件对象**做常量：身份稳定（`===` 语义成立）、可重复渲染、
 * 且 `h(component)` 正是 Vue 里「渲染它」的标准写法。
 * 两种写法都支持：`<AEmpty :image="PRESENTED_IMAGE_SIMPLE" />` 与 `<AEmpty :image="AEmpty.PRESENTED_IMAGE_SIMPLE" />`。
 */

import { withInstall } from '../_internal/with-install';
import { EmptyImage as DefaultEmptyImg, SimpleEmptyImage } from './components/Images';
import EmptyComponent from './Empty.vue';

/** 默认插画（184×152）。对应 antd 的 `PRESENTED_IMAGE_DEFAULT`。 */
export const PRESENTED_IMAGE_DEFAULT = DefaultEmptyImg;

/** 简洁插画（64×41）。对应 antd 的 `PRESENTED_IMAGE_SIMPLE`。 */
export const PRESENTED_IMAGE_SIMPLE = SimpleEmptyImage;

/**
 * Empty 组件。
 *
 * ⚠️ 两个静态属性的**值必须与具名导出是同一个对象** —— `-normal` 类名的判定
 * （`mergedImage === SimpleEmptyImage`）依赖引用相等，给两份不同对象会让它静默失效。
 */
export const Empty = withInstall(
  Object.assign(EmptyComponent, {
    PRESENTED_IMAGE_DEFAULT,
    PRESENTED_IMAGE_SIMPLE,
  }),
);

export default Empty;

export type {
  EmptyConfig,
  EmptyImage,
  EmptyProps,
  EmptyRef,
  EmptySemanticAllType,
  EmptySemanticClassNames,
  EmptySemanticStyles,
  EmptySemanticType,
  EmptySemanticValue,
} from './interface';
