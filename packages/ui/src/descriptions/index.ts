/**
 * Descriptions 的公共导出。
 *
 * 与 antd 的 `es/descriptions/index.js` 对齐：默认导出 Descriptions，静态挂
 * `Descriptions.Item`（radio 的 Group/Button 同范式）；无 `__ANT_*` 标记（antd 无）。
 */

import { withInstall } from '../_internal/with-install';
import { DescriptionsComponent } from './Descriptions';
import { DescriptionsItemComponent } from './DescriptionsItem';

/** Descriptions 组件。注册名 `ADescriptions`（COMPONENT-RULES.md 规则 R2）。 */
export const Descriptions = withInstall(
  Object.assign(DescriptionsComponent, {
    Item: DescriptionsItemComponent,
  }),
);

/** `DescriptionsItem` 具名别名（= `Descriptions.Item`）。 */
export const DescriptionsItem = withInstall(DescriptionsItemComponent);

export default Descriptions;

export type {
  DescriptionsColumn,
  DescriptionsItemSpan,
  DescriptionsItemType,
  DescriptionsProps,
  DescriptionsRef,
  DescriptionsRowItem,
  DescriptionsSemanticClassNames,
  DescriptionsSemanticStyles,
} from './interface';
export { genDescriptionsStyle, genTokenDecls as genDescriptionsTokenDecls } from './style';
export type { ComponentToken as DescriptionsComponentToken } from './style/token';
export { prepareComponentToken as prepareDescriptionsComponentToken } from './style/token';
