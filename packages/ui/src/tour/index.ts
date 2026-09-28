/**
 * Tour 的公共导出。
 *
 * 与 antd 的 es/tour/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import TourComponent from './Tour.vue';

/** Tour 组件。注册名 `ATour`（COMPONENT-RULES.md 规则 R2）。 */
export const Tour = withInstall(TourComponent);

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
  TourSemanticAllType,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourSemanticType,
  TourSemanticValue,
  TourSlots,
  TourStepProps,
  TourType,
} from './interface';

// TODO(G4): export { TourPurePanel } from './PurePanel';（+ `Tour._InternalPanelDoNotUseOrYouWillBeFired`）
// TODO(G4): export { genTourStyle } from './style';
// TODO(G4): export type { ComponentToken as TourComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareTourComponentToken } from './style/token';
