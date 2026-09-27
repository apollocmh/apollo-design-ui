/**
 * Space 的类型面。
 *
 * 契约来源：antd 6.6.4 的 `es/space/index.d.ts` / `Compact.d.ts` / `Addon.d.ts`。
 * **逐字段对齐**，包括 `@deprecated` 标记与可选性。
 *
 * ── 为什么 `Orientation` 在这里**重新声明**而不是从 `divider` 复用 ───────────────
 *
 * antd 从 `_util/hooks` 导入它（全库共享）。我们没有 `_util/`，而 barrel
 * （`packages/ui/src/index.ts`）**已经**从 `./divider` 导出了 `Orientation` ——
 * 若 Space 也导出同名类型，`export type { Orientation } from './space'` 会与
 * 已有导出声明的名字冲突。
 *
 * 所以：本地声明 + **不**从 barrel 导出（antd 也不从 `space` 导出它）。
 * 这与 `divider/interface.ts` 里那份是同构的两个字面量联合，差异登记见
 * `docs/analysis/space.md` §9 与 `COMPATIBILITY.md` §9.2 的 D35。
 * 等 `_internal/use-orientation.ts` 落地时两份合并。
 *
 * ── `GenerateSemantic` 的取舍（D36）─────────────────────────────────────────────
 *
 * antd 的 `SpaceSemanticAllType = GenerateSemantic<SpaceSemanticType, SpaceProps>`
 * 是一个**条件类型**。条件类型无法被泛型函数体证明，最终必须写 `as unknown as`
 * 双重断言 —— 用一个类型漏洞换一个 `?.`，不划算（与 empty / divider 同一裁决）。
 * 所以这里手写 `SpaceSemanticAllType` 接口，字段与 antd 展开后的结果逐条对应。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig, Variant } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { InputStatus } from './statusUtils';
import type { Orientation } from './useOrientation';

export type { InputStatus, Orientation };

// ---------------------------------------------------------------------------
// 语义化
// ---------------------------------------------------------------------------

/** 语义化类名的三个槽位。与 antd 的 `SpaceSemanticType['classNames']` 一致。 */
export interface SpaceSemanticClassNames {
  root?: string;
  item?: string;
  separator?: string;
}

/** 语义化样式的三个槽位。 */
export interface SpaceSemanticStyles {
  root?: CSSProperties;
  item?: CSSProperties;
  separator?: CSSProperties;
}

/**
 * 语义化输入：对象或函数。
 *
 * 对应 antd `GenerateSemantic<...>` 的 `classNamesAndFn` / `stylesAndFn`。
 * 函数式由裁决 `empty-semantic-fn` = B 决定支持（empty / divider 已落地同形）。
 */
export type SpaceSemanticValue<T> = T | ((info: { props: SpaceProps }) => T);

/** antd 的 `SpaceSemanticType`（不含函数式的形态）。 */
export interface SpaceSemanticType {
  classNames?: SpaceSemanticClassNames;
  styles?: SpaceSemanticStyles;
}

/** antd 的 `SpaceSemanticAllType`（含函数式的完整形态）。 */
export interface SpaceSemanticAllType {
  classNames: SpaceSemanticClassNames;
  classNamesAndFn: SpaceSemanticValue<SpaceSemanticClassNames>;
  styles: SpaceSemanticStyles;
  stylesAndFn: SpaceSemanticValue<SpaceSemanticStyles>;
}

// ---------------------------------------------------------------------------
// Space
// ---------------------------------------------------------------------------

/** 间距大小。与 antd 的 `SpaceSize` 一致。 */
export type SpaceSize = SizeType | number;

/** 对齐方式。与 antd 的 `SpaceProps['align']` 一致。 */
export type SpaceAlign = 'start' | 'end' | 'center' | 'baseline';

/**
 * Space 的 props。逐字段对齐 antd 的 `SpaceProps`。
 *
 * ⚠️ 与 antd 的**唯一**结构差异：`className` / `style` 是显式 prop。
 *    Vue 里 `class` / `style` 默认进 `$attrs`，但 antd 的合并顺序要求
 *    `className` 落在根类名的**中间**（在 `-{orientation}` 之后、
 *    `mergedClassNames.root` 之前），且 `style` 要参与语义化合并。
 *    与 empty / divider 同形。
 *
 * `children` **不在** props 里（规则 C19）—— antd 的 `children?: React.ReactNode`
 * 在 Vue 侧是默认插槽 `SpaceSlot`。
 */
export interface SpaceProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 落在根元素上（在 `-{orientation}` / `-align-*` / `-gap-*` 之后）。 */
  className?: string;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /** 根元素的内联样式。参与语义化合并，且**覆盖** `styles.root`。 */
  style?: CSSProperties;
  /**
   * 间距大小。
   *
   * - 预设串（`'small'` / `'medium'` / `'middle'` / `'large'`）→ 类名，值交给 CSS 变量
   * - 非零数字 → 内联 `row-gap` / `column-gap`（**我们补 px**，见 PITFALLS 32）
   * - `[horizontal, vertical]` → 两个方向分别取
   * - `0` → 取用但不产生任何 gap（`isValidGapNumber` 的真值短路）
   *
   * 不传时取 ConfigProvider 的 `space.size`，再兜底 `'small'`。
   * ⚠️ 取值用 `??` 所以 `0` 是**有效值**。
   */
  size?: SpaceSize | [SpaceSize, SpaceSize];
  /**
   * @deprecated please use `orientation` instead
   *
   * 保留并输出开发期告警，与 antd 的废弃节奏一致。
   */
  direction?: Orientation;
  /**
   * 是否垂直。
   *
   * ⚠️ **未传 ≠ `false`**：`useOrientation` 的判据是 `typeof vertical === 'boolean'`，
   *    它把两者当作不同分支（见 `useOrientation.ts` 的文件头）。
   *    `withDefaults` 里的 `vertical: undefined` 不是冗余，删掉会让 `direction` 静默失效。
   */
  vertical?: boolean;
  /** 方向。与 `vertical` 同时配置时以它为准。 */
  orientation?: Orientation;
  /**
   * 对齐方式。
   *
   * 不传时：水平 → `'center'`；垂直 → 保持 `undefined`（**不产生** `-align-*` 类名）。
   * 判据是 `align === undefined`，不是真值判断。
   */
  align?: SpaceAlign;
  /**
   * @deprecated please use the `#separator` slot instead
   *
   * 保留并输出开发期告警，与 antd 的废弃节奏一致。仅保留文本语义
   * （富内容请用 `#separator` 插槽 —— 规则 C8-R2）。
   */
  split?: string;
  /**
   * 分隔符**文本**（富内容用 `#separator` 插槽，slot 优先）。
   *
   * 合并序：`#separator` 插槽 → `separator` → `split`（`??` 语义：`''` 不回落）。
   * Item 里的渲染判据是**真值**：`0` / `''` 时不渲染分隔符。
   */
  separator?: string;
  /** 是否自动换行。仅 `horizontal` 时有意义。 */
  wrap?: boolean;
  /** 语义化类名（拼接）。 */
  classNames?: SpaceSemanticValue<SpaceSemanticClassNames>;
  /** 语义化样式（覆盖）。 */
  styles?: SpaceSemanticValue<SpaceSemanticStyles>;
}

/** 默认插槽。`Space` 会把插槽里的每个子节点包进一个 `-item`。 */
export type SpaceSlot = () => VNodeChild;

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的差异（PLATFORM）：antd 的 `forwardRef` 声明为 `HTMLDivElement`，
 *    但它在首渲染前同样是 `null`（`useRef(null)`），只是类型没体现。
 *    我们按真实情况声明为可空 —— 与 empty / divider 同形。
 */
export interface SpaceRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// Space.Compact
// ---------------------------------------------------------------------------

/**
 * Compact 向子项传播的上下文。
 *
 * ⚠️ 这不是「Compact 的内部状态」，而是**跨组件的公开协议**：
 *    Button / Input / Select / DatePicker / … 共 10 个组件读它来自行拼
 *    `{自己的前缀}-compact-item` 类名（见 `useCompactItemContext`）。
 */
export interface SpaceCompactItemContextType {
  compactSize?: SizeType;
  compactDirection?: 'horizontal' | 'vertical';
  isFirstItem?: boolean;
  isLastItem?: boolean;
}

/** Compact 的 props。逐字段对齐 antd 的 `SpaceCompactProps`。 */
export interface SpaceCompactProps {
  /** 类名前缀。⚠️ antd 传的后缀是 `'space-compact'`，不是 `'compact'`。 */
  prefixCls?: string;
  /** 子组件尺寸。不传则读 ConfigProvider 的 `componentSize`。 */
  size?: SizeType;
  /** @deprecated please use `orientation` instead */
  direction?: Orientation;
  /** 排列方向。与 `vertical` 同时配置时以它为准。 */
  orientation?: Orientation;
  /** ⚠️ 未传 ≠ `false`（同 `SpaceProps['vertical']`）。 */
  vertical?: boolean;
  /** 宽度撑满父元素。 */
  block?: boolean;
  /** 也落在根元素上（在 `className` **之后**）。 */
  rootClassName?: string;
  /** 落在根元素上。 */
  className?: string;
  /** 根元素的内联样式。 */
  style?: CSSProperties;
}

/** `Space.Compact` 暴露的实例。 */
export interface SpaceCompactRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// Space.Addon
// ---------------------------------------------------------------------------

/** Addon 的 props。逐字段对齐 antd 的 `SpaceCompactCellProps`。 */
export interface SpaceAddonProps {
  /** 类名前缀。⚠️ antd 传的后缀是 `'space-addon'`。 */
  prefixCls?: string;
  /** 落在根元素上（在全部结构类名**之后**）。 */
  className?: string;
  /** 根元素的内联样式。 */
  style?: CSSProperties;
  /** 外观变体。默认 `'outlined'`。 */
  variant?: Variant;
  /** 禁用态：加 `-disabled`，颜色改 `colorTextDisabled`。 */
  disabled?: boolean;
  /** 校验状态。`'error'` / `'warning'` 会改变边框色与文字色。 */
  status?: InputStatus;
}

/** `Space.Addon` 暴露的实例。 */
export interface SpaceAddonRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Space 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `space` 配置。与 antd 的
 * `SpaceConfig = ComponentStyleConfig & Pick<SpaceProps, 'size' | 'classNames' | 'styles'>` 一致。
 */
export interface SpaceConfig extends ComponentStyleConfig, SpaceSemanticType {
  size?: SpaceSize | [SpaceSize, SpaceSize];
}
