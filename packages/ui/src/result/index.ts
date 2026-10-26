/** Public Result exports, semantic types and reusable static illustrations. */

import { withInstall } from '../_internal/with-install';
import { ExceptionMap, IconMap } from './maps';
import ResultComponent from './Result.vue';

/** Result 组件。注册名 `AResult`（COMPONENT-RULES.md 规则 R2）。 */
export const Result = withInstall(ResultComponent);

/** 静态插画常量（antd 的 `Result.PRESENTED_IMAGE_403/404/500` 逐字）。 */
export const PRESENTED_IMAGE_403 = ExceptionMap[403];
export const PRESENTED_IMAGE_404 = ExceptionMap[404];
export const PRESENTED_IMAGE_500 = ExceptionMap[500];

export { ExceptionMap, IconMap };

export default Result;

export type {
  ExceptionStatusType,
  ResultConfig,
  ResultProps,
  ResultRef,
  ResultSemanticClassNames,
  ResultSemanticStyles,
  ResultSemanticValue,
  ResultSlots,
  ResultStatusType,
} from './interface';
export { genResultStyle } from './style';
export type { ComponentToken as ResultComponentToken } from './style/token';
