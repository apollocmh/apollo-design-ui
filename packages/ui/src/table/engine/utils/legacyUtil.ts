/**
 * `@rc-component/table@1.11.1` 的 `es/utils/legacyUtil.js`（23 行）—— **逐字移植**。
 *
 * 负责把「老的平铺 expandable props」与「新的 `expandable` 对象」归并成一份配置。
 * 这是 antd 6 的过渡层，**两条路径的判据不同**（见下），照抄就对了。
 */

/** 内部列定义的标记键（rc-table 用它把「自己加的列」与用户的列区分开）。 */
export const INTERNAL_COL_DEFINE = 'RC_TABLE_INTERNAL_COL_DEFINE';

/** 被搬进 `expandable` 的**老字段**清单（用于「用了老字段」的告警）。 */
const LEGACY_EXPANDABLE_KEYS = [
  'indentSize',
  'expandedRowKeys',
  'defaultExpandedRowKeys',
  'defaultExpandAllRows',
  'expandedRowRender',
  'expandRowByClick',
  'expandIcon',
  'onExpand',
  'onExpandedRowsChange',
  'expandedRowClassName',
  'expandIconColumnIndex',
  'showExpandColumn',
  'title',
] as const;

/**
 * 归并 `expandable` 配置。
 *
 * 🚨 **判据是 `'expandable' in props`**（**不是** `props.expandable !== undefined`）：
 *    传了 `expandable: undefined` 也算「用户显式用了新形态」⇒ 走
 *    `{...legacy, ...expandable}` 分支（`expandable` 为 `undefined` 时展开是 no-op）。
 *    ⚠️ 在 Vue 里 **props 恒含全部声明键** ⇒ 不能照搬 `'x' in props`
 *    （那会**恒为真**）⇒ 必须由调用方传一个「用户是否真的给了 expandable」的判据
 *    （本仓用 `undefined` 判定，见 `use-expand.ts` 的说明；差异登记为 PLATFORM）。
 *
 * 另一条判据：`showExpandColumn === false` ⇒ 强制 `expandIconColumnIndex = -1`
 * （即「不渲染展开列」，而不是「渲染在第 -1 列」）。
 *
 * ⚠️ 告警走**传入的 `warn` 回调**（不在这里 `useDevWarning`）：后者必须在组件的
 *    `setup()` 同步阶段调用（内部用 `inject`），而本函数是**纯函数**（L1 要直测）。
 */
export function getExpandableProps<P extends Record<string, unknown>>(
  props: P,
  hasExpandableProp: boolean,
  warn?: (valid: boolean, message: string) => void,
): Record<string, unknown> {
  const { expandable, ...legacyExpandableConfig } = props as P & {
    expandable?: Record<string, unknown>;
  };

  let config: Record<string, unknown>;
  if (hasExpandableProp) {
    config = { ...legacyExpandableConfig, ...(expandable ?? {}) };
  } else {
    if (LEGACY_EXPANDABLE_KEYS.some((prop) => prop in props)) {
      warn?.(false, 'expanded related props have been moved into `expandable`.');
    }
    config = legacyExpandableConfig;
  }

  if (config.showExpandColumn === false) {
    config.expandIconColumnIndex = -1;
  }
  return config;
}
