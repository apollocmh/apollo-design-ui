/**
 * Transfer 的公开出口（antd `es/transfer/index.d.ts`）。
 *
 * 静态挂载（antd 的 `Transfer.List` / `Transfer.Search` / `Transfer.Operation`）
 * 在 Vue 侧以两种形态提供：
 *  1. 组件对象上的属性（`Transfer.List` —— 与 antd 的访问路径一致）；
 *  2. 命名导出 `TransferList` / `TransferSearch` / `TransferOperation`（Vue 习惯，
 *     与 `Table.Summary` → `Summary` 的处理同判）。
 */

import Actions from './Actions';
import Search from './Search';
import Section from './Section';
import Transfer from './Transfer';

/** 静态挂载：`Transfer.List`（自定义列表面板 / 单面板使用）。 */
const TransferList = Section;
/** 静态挂载：`Transfer.Search`。 */
const TransferSearch = Search;
/** 静态挂载：`Transfer.Operation`（操作按钮列）。 */
const TransferOperation = Actions;

Object.assign(Transfer, {
  List: Section,
  Search,
  Operation: Actions,
});

export default Transfer;

export type {
  PaginationType,
  RenderResult,
  RenderResultObject,
  SelectAllLabelRender,
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferListBodyProps,
  TransferLocale,
  TransferProps,
  TransferSemanticClassNames,
  TransferSemanticStyles,
} from './interface';
export { Actions, Search, Section, Transfer, TransferList, TransferOperation, TransferSearch };
