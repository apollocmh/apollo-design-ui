/** Apollo Flex public exports. Historical reference: Ant Design 6.6.4 (MIT), docs/analysis/flex.md. */

import { withInstall } from '../_internal/with-install';
import FlexComponent from './Flex.vue';

/** Flex 组件。注册名 `AFlex`（COMPONENT-RULES.md 规则 R2）。 */
export const Flex = withInstall(FlexComponent);

export default Flex;

export type {
  FlexAlign,
  FlexComponent,
  FlexConfig,
  FlexJustify,
  FlexProps,
  FlexRef,
  FlexSlot,
  FlexWrap,
  Orientation,
} from './interface';
export { genFlexStyle } from './style';
export type { ComponentToken as FlexComponentToken } from './style/token';
export { prepareComponentToken as prepareFlexComponentToken } from './style/token';
