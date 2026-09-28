/**
 * Tour 的公共导出。
 *
 * 与 antd 的 es/tour/index.js 对齐的对外面：
 * `Tour` / `Tour._InternalPanelDoNotUseOrYouWillBeFired`（= TourPurePanel）/
 * 类型面 / 样式生成（genTourStyle → COMPONENT_STYLES 清单消费）。
 */

import { withInstall } from '../_internal/with-install';
import PurePanelComponent from './PurePanel';
import TourComponent from './Tour';

/** Tour 组件。注册名 `ATour`（COMPONENT-RULES.md 规则 R2）。 */
export const Tour = withInstall(TourComponent);

/** 静态面板（`Tour._InternalPanelDoNotUseOrYouWillBeFired` 的对应物）。 */
export const TourPurePanel = withInstall(PurePanelComponent);

Tour._InternalPanelDoNotUseOrYouWillBeFired = TourPurePanel;

export default Tour;

export type {
  TourAnimatedConfig,
  TourArrowConfig,
  TourButtonProps,
  TourClosableConfig,
  TourEmits,
  TourGap,
  TourLocale,
  TourMaskConfig,
  TourPlacement,
  TourProps,
  TourPurePanelProps,
  TourSemanticAllType,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourSemanticType,
  TourSemanticValue,
  TourSlots,
  TourStepProps,
  TourType,
} from './interface';
export { genTourStyle, genTourTokenDecls } from './style';
export type { ComponentToken as TourComponentToken } from './style/token';
export { prepareComponentToken as prepareTourComponentToken, tourTokenValues } from './style/token';
