/**
 * Select 的公共导出。
 *
 * 与 antd 的 `es/select/index.js` 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import OptGroupComponent from './OptGroup';
import OptionComponent from './Option';
import PurePanelComponent from './PurePanel';
import SelectComponent from './Select';

/** Select 组件。注册名 `ASelect`（COMPONENT-RULES.md 规则 R2）。 */
export const Select = withInstall(SelectComponent);

/** `Select.Option`（antd 已 deprecated，推荐 `options`）。 */
export const SelectOption = withInstall(OptionComponent);

/** `Select.OptGroup`（antd 已 deprecated，推荐 `options`）。 */
export const SelectOptGroup = withInstall(OptGroupComponent);

/** 静态面板（`Select._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const SelectPurePanel = withInstall(PurePanelComponent);

Object.assign(Select, {
  Option: OptionComponent,
  OptGroup: OptGroupComponent,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanelComponent,
});

export type {
  CustomTagProps,
  DefaultOptionType,
  DisplayValueType,
  FieldNames,
  FlattenOptionData,
  LabeledValue,
  LabelInValueType,
  OptGroupProps,
  OptionProps,
  RawValueType,
  ScrollToArg,
  SearchConfig,
  SelectCommonPlacement,
  SelectDirection,
  SelectEmits,
  SelectMode,
  SelectOptionType,
  SelectProps,
  SelectRef,
  SelectSearchConfig,
  SelectSemanticClassNames,
  SelectSemanticStyles,
  SelectSize,
  SelectSlots,
  SelectStatus,
  SelectValue,
  SelectVariant,
} from './interface';

export { genSelectStyle } from './style';
export type { ComponentToken as SelectComponentToken } from './style/token';
export { prepareComponentToken as prepareSelectComponentToken } from './style/token';

export default Select;
