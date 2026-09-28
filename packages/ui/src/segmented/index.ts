/**
 * Segmented 的公共导出。
 *
 * 与 antd 的 `es/segmented/index.js` 对齐：默认导出 Segmented。
 * antd 无子组件 / 静态方法 —— Segmented 是单一组件。
 */

import { withInstall } from '../_internal/with-install';
import { SegmentedComponent } from './Segmented';

/** Segmented 组件。注册名 `ASegmented`（COMPONENT-RULES.md 规则 R2）。 */
export const Segmented = withInstall(SegmentedComponent);

export default Segmented;

export type {
  SegmentedLabeledOption,
  SegmentedLabeledOptionWithIcon,
  SegmentedLabeledOptionWithoutIcon,
  SegmentedOption,
  SegmentedOptions,
  SegmentedProps,
  SegmentedRawOption,
  SegmentedRef,
  SegmentedSemanticClassNames,
  SegmentedSemanticStyles,
  SegmentedValue,
} from './interface';
export { genSegmentedStyle, genTokenDecls as genSegmentedTokenDecls } from './style';
export type { ComponentToken as SegmentedComponentToken } from './style/token';
export { prepareComponentToken as prepareSegmentedComponentToken } from './style/token';
