/**
 * Anchor 的公共导出。
 *
 * 与 antd 的 `es/anchor/index.js` 对齐的对外面（它是复合组件 `Anchor.Link`）。
 * ⚠️ 复合挂载照 `splitter/index.ts` 的既有写法（`Object.assign` + `withInstall`）。
 */

import { withInstall } from '../_internal/with-install';
import { Anchor as AnchorComponent } from './Anchor';
import { AnchorLink as AnchorLinkComponent } from './AnchorLink';

/** 复合组件：`Anchor.Link`（antd 的 `CompoundedComponent`）。 */
export const AnchorWithLink = Object.assign(AnchorComponent, { Link: AnchorLinkComponent });

/** Anchor 组件（含复合子组件 `Anchor.Link`）。注册名 `AAnchor`。 */
export const Anchor = withInstall(AnchorWithLink);

/** 链接组件（`Anchor.Link` 的具名导出）。注册名 `AAnchorLink`。 */
export const AnchorLink = withInstall(AnchorLinkComponent);

export default Anchor;

// ---------------------------------------------------------------- 类型（G2 产物）
export type {
  AnchorAffixConfig,
  AnchorContainer,
  AnchorDirection,
  AnchorEmits,
  AnchorKey,
  AnchorLinkBaseProps,
  AnchorLinkInfo,
  AnchorLinkItemProps,
  AnchorLinkProps,
  AnchorLinkSlots,
  AnchorProps,
  AnchorSemanticClassNames,
  AnchorSemanticStyles,
  AnchorSlots,
} from './interface';

// ---------------------------------------------------------------- 样式（G4 产物）
export { genAnchorStyle, genTokenDecls as genAnchorTokenDecls } from './style';
export type { ComponentToken as AnchorComponentToken } from './style/token';
export { prepareComponentToken as prepareAnchorComponentToken } from './style/token';
