/**
 * 根节点的类名组装（G4 · S1）。
 *
 * 契约来源：antd 6.6.4 `es/date-picker/generatePicker/generateSinglePicker.js`
 * 的 `className` 组装（**重新定义**，不搬运）。实测口径见
 * `docs/analysis/date-picker.md` §3.2 / §4.4。
 *
 * ```js
 * className: clsx(
 *   {
 *     [`${prefixCls}-large`]:  mergedSize === 'large',
 *     [`${prefixCls}-small`]:  mergedSize === 'small',
 *     [`${prefixCls}-${variant}`]: enableVariantCls,
 *   },
 *   getStatusClassNames(prefixCls, getMergedStatus(contextStatus, customStatus), hasFeedback),
 *   compactItemClassnames,
 *   contextPickerConfig?.className,
 *   className,
 * )
 * ```
 *
 * 状态与禁用的归一（`getStatusClassNames` / `getMergedStatus` / `isPairDisabled`）
 * 在 `picker-shared.ts` —— 它们被三处用，不该只属于根类名。
 *
 * ── ⚠️ 两条实测判据（都与「想当然」相反）─────────────────────────────────────
 *
 * 1. **`-outlined` 默认就会出现**（实测 `ant-picker ant-picker-outlined`）——
 *    因为默认 `variant='outlined'` 时 `enableVariantCls` 为 true。
 *    「默认只有 `${prefixCls}` 一个类」是错的。
 * 2. **`status="error"` 即使没有 Form 也加 `-status-error`**
 *    （实测 `ant-picker ant-picker-outlined ant-picker-status-error`）。
 *    `hasFeedback` 只控制 `-has-feedback` 那一个类（见 `picker-shared.ts`）。
 *
 * ── 尺寸归一 ───────────────────────────────────────────────────────────────
 *
 * `'middle' | 'medium'` ⇒ **不加类**（默认尺寸）；`'small'` / `'large'` 各加一个。
 *
 * ⚠️ `rootClassName` 在上游走的是 `mergedRootClassName`（注入 rc 的 `rootClassName`），
 * 本仓无 cssinjs hash，放在最后一位；位置差异对 CSS 优先级无影响（同级单类选择器）。
 */

import { getStatusClassNames, type InputStatus } from '../../space/statusUtils';

/** 根类名的组装选项（全部是**已归一**的值）。 */
export interface RootClassOptions {
  prefixCls: string;
  /** 已归一的尺寸（`'small' | 'medium' | 'middle' | 'large'`）。 */
  size?: string | undefined;
  /** 已归一的变体（默认 `'outlined'`）。 */
  variant?: string | undefined;
  /** `enableVariantCls`：变体在枚举内才加 `-{variant}` 类。 */
  enableVariantCls?: boolean;
  /**
   * 已合并的 status（`getMergedPickerStatus` 的产物）。
   *
   * ⚠️ 类型用 `space/statusUtils` 的 `InputStatus`（`'warning' | 'error' | '' | 'success' | 'validating'`）
   * —— 即上游 `ValidateStatus` 的字面量集。本组件的 `DatePickerStatus` 只是它的**子集**
   * （`'error' | 'warning'`），但合并后可能来自 Form.Item 的完整集合。
   */
  status?: InputStatus | undefined;
  hasFeedback?: boolean;
  /** Space 的 compact 类名（S1 恒为空，留给后续接 Space Compact）。 */
  compactItemClassnames?: string;
  /** ConfigProvider 的组件级 className。 */
  contextClassName?: string;
  /** 组件自己的 `className` prop。 */
  className?: string;
  /** `rootClassName`（与 `className` 并列，上游有两个入口）。 */
  rootClassName?: string;
}

/**
 * 组装根类名。
 *
 * 顺序对齐上游 `clsx(...)` 的参数序：
 * 尺寸 / 变体 → 状态（+ `-has-feedback`）→ compact → context → `className` → `rootClassName`。
 */
export function getRootClassNames(options: RootClassOptions): (string | undefined)[] {
  const { prefixCls } = options;
  const classes: (string | undefined)[] = [prefixCls];

  if (options.size === 'large') {
    classes.push(`${prefixCls}-large`);
  } else if (options.size === 'small') {
    classes.push(`${prefixCls}-small`);
  }

  if (options.enableVariantCls !== false && options.variant) {
    classes.push(`${prefixCls}-${options.variant}`);
  }

  // ⚠️ `space/statusUtils` 的 `getStatusClassNames` 返回的是**空格拼接的字符串**
  //    （不是数组）⇒ 必须整体 `push`。写成 `push(...getStatusClassNames(...))`
  //    会把字符串**按字符展开**，产出一堆单字母类名（静默、只在 L4/L6 才暴露）。
  const statusCls = getStatusClassNames(prefixCls, options.status, options.hasFeedback === true);
  if (statusCls) {
    classes.push(statusCls);
  }

  if (options.compactItemClassnames) {
    classes.push(options.compactItemClassnames);
  }
  if (options.contextClassName) {
    classes.push(options.contextClassName);
  }
  if (options.className) {
    classes.push(options.className);
  }
  if (options.rootClassName) {
    classes.push(options.rootClassName);
  }

  return classes;
}
