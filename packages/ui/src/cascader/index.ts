/**
 * Cascader 的公共导出。静态属性：`SHOW_PARENT` / `SHOW_CHILD` / `Panel` /
 * `_InternalPanelDoNotUseOrYouWillBeFired`。
 *
 * ⚠️ antd 里这两个静态属性是**两个不同的组件**：
 *   · `Cascader.Panel` = rc Panel = **只有列**（本仓 `./Panel`）
 *   · `Cascader._InternalPanelDoNotUseOrYouWillBeFired` = `genPurePanel(Cascader)`
 *     = **完整 Cascader**（外壳 + 浮层）塞进 holder div
 * 本仓暂把后者也指向 `./Panel`（范围裁剪，登记为 COMPATIBILITY.md **D113**）——
 * 不要因为「两个名字指同一个组件」而把它当成 antd Panel 的形态去改 `./Panel`
 * （那是已回退的一次误判）。
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
    // 见文件头：antd 这里是 PurePanel，本仓暂指向 rc Panel 形态（D113）。
    _InternalPanelDoNotUseOrYouWillBeFired: CascaderPanelComponent,
  }),
);

/** `Cascader.Panel` 的具名别名（= rc Panel，只有列）。 */
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
