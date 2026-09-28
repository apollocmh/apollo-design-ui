/**
 * Progress 的公共导出。
 */

import { withInstall } from '../_internal/with-install';
import ProgressComponent from './Progress';

/** Progress 组件。注册名 `AProgress`（COMPONENT-RULES.md 规则 R2）。 */
export const Progress = withInstall(ProgressComponent);

export default Progress;

export type {
  GapPlacement,
  GapPosition,
  PercentPositionType,
  ProgressGradient,
  ProgressProps,
  ProgressSemanticClassNames,
  ProgressSemanticStyles,
  ProgressSize,
  ProgressStatus,
  ProgressType,
  StringGradients,
  SuccessProps,
} from './interface';
export { genProgressStyle, genProgressTokenDecls } from './style';
export { LineStrokeColorVar } from './utils';
