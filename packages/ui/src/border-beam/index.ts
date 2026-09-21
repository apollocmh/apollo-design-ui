/**
 * BorderBeam 的公共导出。
 *
 * 与 antd 的 `es/border-beam/index.js` 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import BorderBeamComponent from './BorderBeam';

/** BorderBeam 组件。注册名 `ABorderBeam`（COMPONENT-RULES.md 规则 R2）。 */
export const BorderBeam = withInstall(BorderBeamComponent);

export default BorderBeam;

export type {
  BorderBeamColor,
  BorderBeamGradient,
  BorderBeamProps,
  BorderBeamSlot,
} from './interface';
export { genBorderBeamStyle } from './style';
export type { ComponentToken as BorderBeamComponentToken } from './style/token';
export {
  DEFAULT_BORDER_BEAM_DURATION,
  getBorderBeamGradient,
} from './util';
