/**
 * Splitter 的 Component Token（antd `prepareComponentToken` 全 **4 个字段**）。
 *
 * 契约来源：antd 6.6.4 `es/splitter/style/index.js`：
 *
 * ```js
 * const splitBarSize = token.splitBarSize || 2;
 * const splitTriggerSize = token.splitTriggerSize || 6;
 * const resizeSpinnerSize = token.resizeSpinnerSize || 20;
 * const splitBarDraggableSize = token.splitBarDraggableSize ?? resizeSpinnerSize;
 * ```
 *
 * `token.splitBarSize` 等在 alias 上不存在 ⇒ **恒取默认常量**，构建期解析值落地
 * （D50 同判；它们只参与几何 width/height）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 把手视觉宽。 */
  splitBarSize: number;
  /** 把手热区宽。 */
  splitTriggerSize: number;
  /** 拖拽 spinner 尺寸。 */
  resizeSpinnerSize: number;
  /** spinner 段高（缺省 = resizeSpinnerSize）。 */
  splitBarDraggableSize: number;
}

export const prepareComponentToken = (_token: AliasToken): ComponentToken => {
  const splitBarSize = 2;
  const splitTriggerSize = 6;
  // https://github.com/ant-design/ant-design/pull/51223
  const resizeSpinnerSize = 20;
  const splitBarDraggableSize = resizeSpinnerSize;
  return {
    splitBarSize,
    splitTriggerSize,
    splitBarDraggableSize,
    resizeSpinnerSize,
  };
};

export default prepareComponentToken;
