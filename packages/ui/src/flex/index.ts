/**
 * Flex 的公共导出。
 *
 * 与 antd 的 `es/flex/index.js` 对齐的对外面：
 *   - 默认导出 `Flex`
 *   - 全部类型（`FlexProps` / `FlexRef` / `FlexConfig` / 方向与对齐枚举）
 *
 * antd 的 `flexWrapValues` 等三个枚举数组**不**从组件 index 导出
 * （它们住在 `es/flex/utils.js`）—— 我们同样只放在 `./utils`，不进本文件。
 */

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
