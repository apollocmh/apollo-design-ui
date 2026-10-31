/** Existing Splitter defaults. Runtime component overrides use the same four tokens;
 * resizeSpinnerSize is the fallback source of splitBarDraggableSize. */

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
