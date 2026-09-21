/**
 * Affix 的公共导出。
 *
 * 与 antd 的 `es/affix/index.js` 对齐的对外面：
 *   - 默认导出 `Affix`
 *   - 全部类型（`AffixProps` / `AffixRef` / `AffixConfig` / `AffixTarget` / `AffixRect` / `AffixSlot`）
 *   - 判据纯函数（`getFixedTop` / `getFixedBottom` / `getTargetRect`）——
 *     **导出它们**是因为单测要直接钉死判据（antd 没导出，但它自己也用了
 *     单独的 `utils.js`；导出比「为了测而复制一份」更诚实）。
 *
 * Affix 没有子组件、没有静态方法。
 */

import { withInstall } from '../_internal/with-install';
import AffixComponent from './Affix.vue';

/** Affix 组件。注册名 `AAffix`（`COMPONENT-RULES.md` 规则 R2）。 */
export const Affix = withInstall(AffixComponent);

export default Affix;

export type {
  AffixConfig,
  AffixProps,
  AffixRect,
  AffixRef,
  AffixSlot,
  AffixTarget,
} from './interface';
export { getFixedBottom, getFixedTop, getTargetRect } from './utils';
export { genAffixStyle } from './style';
export type { ComponentToken as AffixComponentToken } from './style/token';
export { prepareComponentToken as prepareAffixComponentToken } from './style/token';
