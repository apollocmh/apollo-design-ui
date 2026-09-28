/**
 * Popconfirm 的公共导出。
 *
 * 与 antd 的 `es/popconfirm/index.js` 对齐：默认导出 Popconfirm，静态挂
 * `_InternalPanelDoNotUseOrYouWillBeFired`（PurePanel）。
 */

import { withInstall } from '../_internal/with-install';
import PopconfirmComponent from './Popconfirm';
import PurePanelComponent from './PurePanel';

/** Popconfirm 组件。注册名 `APopconfirm`（COMPONENT-RULES.md 规则 R2）。 */
export const Popconfirm = withInstall(
  Object.assign(PopconfirmComponent, {
    _InternalPanelDoNotUseOrYouWillBeFired: PurePanelComponent,
  }),
);

/** `Popconfirm._InternalPanelDoNotUseOrYouWillBeFired` 的具名别名。 */
export const PopconfirmPurePanel = withInstall(PurePanelComponent);

export default Popconfirm;

export type {
  PopconfirmButtonProps,
  PopconfirmClassNames,
  PopconfirmProps,
  PopconfirmRef,
  PopconfirmSemanticType,
  PopconfirmStyles,
  TooltipPlacement as PopconfirmPlacement,
} from './interface';
export { genPopconfirmStyle, genTokenDecls as genPopconfirmTokenDecls } from './style';
export type { ComponentToken as PopconfirmComponentToken } from './style/token';
export { prepareComponentToken as preparePopconfirmComponentToken } from './style/token';
