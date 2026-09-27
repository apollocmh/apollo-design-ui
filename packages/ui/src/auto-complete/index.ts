/**
 * AutoComplete 的公共导出。
 *
 * 与 antd 的 es/auto-complete/index.js 对齐的对外面（含 compound `Option`）。
 */

import { withInstall } from '../_internal/with-install';
import { SelectOption } from '../select';
import AutoCompleteComponent from './AutoComplete';

/** AutoComplete 组件。注册名 `AAutoComplete`（COMPONENT-RULES.md 规则 R2）。 */
export const AutoComplete = withInstall(AutoCompleteComponent);

/** @deprecated 用 `options`。与 antd 的 `AutoComplete.Option` 逐字对应。 */
export const AutoCompleteOption = SelectOption;

export default AutoComplete;

export type {
  AutoCompleteProps,
  AutoCompleteRef,
  AutoCompleteSemanticClassNames,
  AutoCompleteSemanticStyles,
  DataSourceItemObject,
  DataSourceItemType,
  InputStatus,
} from './interface';
