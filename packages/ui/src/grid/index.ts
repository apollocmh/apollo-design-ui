/**
 * Grid 的公共导出（Row + Col）。
 *
 * 与 antd 的 `es/grid/index.js` 对齐的对外面：默认导出 Row + 命名导出 Row/Col
 * （antd 的 `import { Row, Col } from 'antd'`）。
 */

import { withInstall } from '../_internal/with-install';
import ColComponent from './Col.vue';
import RowComponent from './Row.vue';

/** Row 组件。注册名 `ARow`（COMPONENT-RULES.md 规则 R2）。 */
export const Row = withInstall(RowComponent);

/** Col 组件。注册名 `ACol`（COMPONENT-RULES.md 规则 R2）。 */
export const Col = withInstall(ColComponent);

export default Row;

export { default as useBreakpoint } from './hooks/use-breakpoint';
export type {
  Breakpoint,
  ColConfig,
  ColProps,
  ColSize,
  GridRef,
  GridSlot,
  Gutter,
  GutterValue,
  ResponsiveValue,
  RowAlign,
  RowConfig,
  RowContextValue,
  RowJustify,
  RowProps,
} from './interface';
export { genGridStyle } from './style';
export type {
  ColComponentToken,
  RowComponentToken,
} from './style/token';
export {
  prepareColComponentToken,
  prepareRowComponentToken,
} from './style/token';
export { parseFlex as gridParseFlex } from './utils';
