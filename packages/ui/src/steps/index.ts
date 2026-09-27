/**
 * Steps 的公共导出。
 *
 * 与 antd 的 es/steps/index.js 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import StepsComponent from './Steps';

/** Steps 组件。注册名 `ASteps`（COMPONENT-RULES.md 规则 R2）。 */
export const Steps = withInstall(StepsComponent);

export default Steps;

export type {
  StepItem,
  StepsIconRenderSlotProps,
  StepsItemRenderSlotProps,
  StepsItemWrapperRenderSlotProps,
  StepsOrientation,
  StepsProgressDotSlotProps,
  StepsProps,
  StepsRenderInfo,
  StepsSemanticClassNames,
  StepsSemanticName,
  StepsSemanticStyles,
  StepsSize,
  StepsSlots,
  StepsStatus,
  StepsType,
  StepsVariant,
} from './interface';
export type { ComponentToken as StepsComponentToken } from './style/token';
export { prepareStepsComponentToken, stepsTokenValues } from './style/token';
