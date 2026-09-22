/**
 * Watermark 的公共导出。
 *
 * 与 antd 的 `es/watermark/index.js` 对齐的对外面。
 * ⚠️ 本组件**无样式表**（全内联 style + canvas）—— 不注册 COMPONENT_STYLES。
 */

import { withInstall } from '../_internal/with-install';
import WatermarkComponent from './Watermark';

/** Watermark 组件。注册名 `AWatermark`（COMPONENT-RULES.md 规则 R2）。 */
export const Watermark = withInstall(WatermarkComponent);

export default Watermark;

export type {
  WatermarkContent,
  WatermarkFont,
  WatermarkProps,
  WatermarkRef,
  WatermarkText,
} from './interface';
export { FontGap } from './use-clips';
export { getPixelRatio, getStyleStr, reRendering } from './utils';
