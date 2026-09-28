/**
 * Cascader 的公共导出。静态属性：`SHOW_PARENT` / `SHOW_CHILD` / `Panel` /
 * `_InternalPanelDoNotUseOrYouWillBeFired`（对齐 antd）。
 */

import { withInstall } from '../_internal/with-install';
import CascaderComponent from './Cascader';
import CascaderPanelComponent from './Panel';
import { SHOW_CHILD, SHOW_PARENT } from './utils';

/** Cascader 组件。注册名 `ACascader`（规则 R2）。 */
export const Cascader = withInstall(
  Object.assign(CascaderComponent, {
    SHOW_PARENT,
    SHOW_CHILD,
    Panel: CascaderPanelComponent,
    _InternalPanelDoNotUseOrYouWillBeFired: CascaderPanelComponent,
  }),
);

/** `Cascader.Panel`（= `_InternalPanelDoNotUseOrYouWillBeFired`）的具名别名。 */
export const CascaderPanel = withInstall(CascaderPanelComponent);

export default Cascader;

export type { CascaderPanelProps } from './Panel';
export { genCascaderStyle, genTokenDecls as genCascaderTokenDecls } from './style';
export type { ComponentToken as CascaderComponentToken } from './style/token';
export { prepareComponentToken as prepareCascaderComponentToken } from './style/token';
export type {
  BaseOptionType,
  DefaultOptionType,
  FieldNames,
  RawValue,
  ShowCheckedStrategy,
  ValueCell,
} from './utils';
export { SHOW_CHILD, SHOW_PARENT } from './utils';
