/**
 * Masonry 的公共导出。
 *
 * 与 antd 的 `es/masonry/index.js` 对齐的对外面（它只导出组件与两个类型）。
 */

import { withInstall } from '../_internal/with-install';
import MasonryComponent from './Masonry.vue';

/** Masonry 组件。注册名 `AMasonry`（COMPONENT-RULES.md 规则 R2）。 */
export const Masonry = withInstall(MasonryComponent);

export default Masonry;

// ---------------------------------------------------------------- 类型（G2 产物）
export type {
  MasonryEmits,
  MasonryExpose,
  MasonryItemRenderInfo,
  MasonryItemType,
  MasonryKey,
  MasonryLayoutItem,
  MasonryProps,
  MasonryRef,
  MasonrySemanticClassNames,
  MasonrySemanticStyles,
} from './interface';

// ---------------------------------------------------------------- 样式（G4 产物）
export { genMasonryStyle } from './style';
export type { ComponentToken as MasonryComponentToken } from './style/token';
export { prepareComponentToken as prepareMasonryComponentToken } from './style/token';
