/**
 * Rate 的公共导出。
 *
 * 与 antd 的 es/rate/index.js 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import RateComponent from './Rate';

/** Rate 组件。注册名 `ARate`（COMPONENT-RULES.md 规则 R2）。 */
export const Rate = withInstall(RateComponent);

export default Rate;

export type { RateProps, RateRef, StarRenderInfo } from './interface';
export type { RateConfig } from './Rate';
export { genRateStyle, genTokenDecls as genRateTokenDecls } from './style';
export type { ComponentToken as RateComponentToken } from './style/token';
export { prepareComponentToken as prepareRateComponentToken } from './style/token';
