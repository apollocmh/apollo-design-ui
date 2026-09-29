/**
 * Pagination 的类型契约（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `es/pagination/{index,Pagination}.d.ts` + rc 内核
 * `@rc-component/pagination@1.4.0` 的 `es/interface.d.ts`（**重新定义**，不搬运，H2）。
 * 判据逐条见 `docs/analysis/pagination.md`。
 *
 * ── Vue 化映射（COMPATIBILITY.md 的规则）───────────────────────────────────────
 *
 * | React | Vue | 规则 |
 * |---|---|---|
 * | `current` + `onChange` | `v-model:current`（同时发 `change`，C11） | §3 |
 * | `pageSize` + `onShowSizeChange` | `v-model:pageSize` + `@show-size-change` | §3 |
 * | `itemRender` / `showTotal` | **scoped slot** `#itemRender` / `#total` | C8 |
 * | `components.sizeChanger` | **scoped slot** `#sizeChanger`（槽参数与 antd 同形） | C8 |
 * | `showQuickJumper.goButton`（ReactNode） | `VNodeChild` prop（**显式 `undefined` 默认**，PITFALLS 2） | PLATFORM |
 * | `role: AriaRole` | `string` | PLATFORM |
 * | `selectComponentClass` | **不实现**（antd：非官方 API + v7 移除） | UPSTREAM |
 *
 * ⚠️ 本组件**没有** expose：antd 的 `Pagination` 是 `React.FC`（不是 forwardRef），
 *    rc 内部的 `paginationRef`（指向 `<ul>`）不是公开 API。
 *
 * ⚠️ 属性透传按 rc 的 `pickAttrs(props, { aria: true, data: true })`：只把 `aria-*` / `data-*`
 *    落到根 `<ul>`，其余未知属性**丢弃**（`class` / `style` 走各自的通道）。
 */

import type { PaginationLocale } from '@apollo-design/locale';
import type { CSSProperties, VNodeChild } from 'vue';
import type { SelectProps } from '../select';

export type { PaginationLocale };

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 整体对齐（antd 的 `align`，落到 `{p}-start` / `-center` / `-end`）。 */
export type PaginationAlign = 'start' | 'center' | 'end';

/** 简化模式：`{ readOnly: true }` 时页码只是文本，不可输入。 */
export type PaginationSimple = boolean | { readOnly?: boolean };

/** `itemRender` 的第二个参数（页码的类型）。 */
export type PaginationItemType = 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next';

/** `showTotal(total, range)` 的第二个参数：`[起始项, 结束项]`。 */
export type PaginationRange = [number, number];

/** ⚠️ 只在 `PaginationConfig`（给 table 之类的容器用）里出现，本组件不实现布局。 */
export type PaginationPosition = 'top' | 'bottom' | 'both';

// ---------------------------------------------------------------------------
// 语义化（antd `PaginationSemanticType`：**2 槽**）
// ---------------------------------------------------------------------------

export interface PaginationSemanticClassNames {
  root?: string;
  /** ⚠️ 落到**每个** `li`（页码 / 上一页 / 下一页 / 跳页），**不**落到 `<ul>`。 */
  item?: string;
}

export interface PaginationSemanticStyles {
  root?: CSSProperties;
  item?: CSSProperties;
}

/** 语义化输入：对象或函数（对应 antd 的 `GenerateSemantic<PaginationSemanticType, PaginationProps>`）。 */
export type PaginationSemanticValue<T> = T | ((info: { props: PaginationProps }) => T);

/** antd 的 `PaginationSemanticAllType`（手写形态，与 alert / empty 同条）。 */
export interface PaginationSemanticAllType {
  classNames: PaginationSemanticClassNames;
  classNamesAndFn: PaginationSemanticValue<PaginationSemanticClassNames>;
  styles: PaginationSemanticStyles;
  stylesAndFn: PaginationSemanticValue<PaginationSemanticStyles>;
}

// ---------------------------------------------------------------------------
// 尺寸切换器（antd 的 `components.sizeChanger` / rc 的 `sizeChangerRender`）
// ---------------------------------------------------------------------------

/**
 * 自定义尺寸切换器拿到的信息。
 *
 * ⚠️ **两个上游通道、两个字段名**，本仓同时给出（同一个函数）：
 *   - rc `Options.js` 的 `sizeChangerRender` 实参叫 **`onSizeChange`**；
 *   - antd `components.sizeChanger` 的实参叫 **`onChange`**。
 *   只给一个会让另一侧静默失效（G4 实测：写成 `onChange` 时 rc 口径的调用点全部拿到 `undefined`）。
 */
export interface PaginationSizeChangerInfo {
  /** 当前 pageSize。 */
  value: number;
  /** 切换 pageSize（内部会走 `changePageSize` 的完整链路）。rc 口径。 */
  onSizeChange: (value: number) => void;
  /** 同上。antd 的 `components.sizeChanger` 口径（别名）。 */
  onChange: (value: number) => void;
  disabled: boolean;
  /** rc 传进来的类名（`{p}-options-size-changer`）。 */
  className: string;
  /** 可选项（`label` 已是「10 条/页」这样的成品文案）。 */
  options: { label: VNodeChild; value: number }[];
  'aria-label'?: string;
}

/** `itemRender` 的签名（antd 原样：收三个参数，返回节点）。 */
export type PaginationItemRender = (
  page: number,
  type: PaginationItemType,
  element: VNodeChild,
) => VNodeChild;

/** `showTotal` 的签名。 */
export type PaginationShowTotal = (total: number, range: PaginationRange) => VNodeChild;

// ---------------------------------------------------------------------------
// props
// ---------------------------------------------------------------------------

/**
 * `Pagination` 的 props。
 *
 * ⚠️ antd 的 `PaginationProps` 是 `Omit<RcPaginationProps, 'showSizeChanger' | 'pageSizeOptions' |
 *    'classNames' | 'styles' | 'sizeChangerRender'>` + 追加；本仓直接按「最终对外形状」定义
 *    （H2：重新定义而不是搬运继承链）。
 */
export interface PaginationProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  style?: CSSProperties;
  /** ⚠️ `total === 0` 时 `allPages === 0`，`current` 被钳到 **1**（不是 0）。 */
  total?: number;
  /** 受控当前页（`v-model:current`）。 */
  current?: number;
  defaultCurrent?: number;
  /** 受控 pageSize（`v-model:pageSize`）。 */
  pageSize?: number;
  defaultPageSize?: number;
  /** 每页条数的可选项；⚠️ 字符串形态 antd 标注「下个大版本移除」，本仓**只收数字**。 */
  pageSizeOptions?: number[];
  /** 尺寸切换器的显示阈值（rc 默认 50：`total > 50` 才默认显示）。 */
  totalBoundaryShowSizeChanger?: number;
  /**
   * 尺寸切换器：`true` / `false` / **Select 的 props 对象**（对象 ⇒ 视为启用 + 透传）。
   * 未传时与 ConfigProvider 的 `pagination.showSizeChanger` 做 `??` 合并，再回落到
   * `total > totalBoundaryShowSizeChanger`。
   */
  showSizeChanger?: boolean | SelectProps;
  /** 快速跳转；`{ goButton }` 可自定义确认按钮。 */
  showQuickJumper?: boolean | { goButton?: VNodeChild };
  /** 隐藏跳页项（`jump-prev` / `jump-next`）。 */
  showPrevNextJumpers?: boolean;
  /** 每页只显示更少的页码（`pageBufferSize` 从 2 变 1，跳页步长从 5 变 3）。 */
  showLessItems?: boolean;
  /** 是否给 `li` 加 `title`（默认 `true`）。 */
  showTitle?: boolean;
  /** 只有一页时隐藏整个分页器。 */
  hideOnSinglePage?: boolean;
  /** 简化模式（只有上一页/下一页 + `x / y` 输入）。 */
  simple?: PaginationSimple;
  /** 整体禁用。 */
  disabled?: boolean;
  /** 尺寸；未传走 ConfigProvider，`responsive` 下 `xs` 时回落 `small`。 */
  size?: 'small' | 'default' | 'large';
  /** 响应式（`xs` 断点且未显式指定 `size` 时用 `small`）。 */
  responsive?: boolean;
  align?: PaginationAlign;
  /** 覆盖默认语言包（与 ConfigProvider 的 `Pagination` 分片合并，**props 优先**）。 */
  locale?: PaginationLocale;
  /** `itemRender(page, type, element)`。 */
  itemRender?: PaginationItemRender;
  /** `showTotal(total, range)`。 */
  showTotal?: PaginationShowTotal;
  /** 根 `<ul>` 的 role。 */
  role?: string;
  classNames?: PaginationSemanticValue<PaginationSemanticClassNames>;
  styles?: PaginationSemanticValue<PaginationSemanticStyles>;
  /** 自定义尺寸切换器（替代 antd 的 `components.sizeChanger`）。 */
  sizeChangerRender?: (info: PaginationSizeChangerInfo) => VNodeChild;
}

/** 给容器（table 等）用的配置形状：⚠️ 本组件**只导出类型**，不实现 `position` 的布局。 */
export interface PaginationConfig extends Omit<PaginationProps, 'rootClassName'> {
  position?: PaginationPosition;
}

// ---------------------------------------------------------------------------
// emits / slots
// ---------------------------------------------------------------------------

export interface PaginationEmits {
  /** v-model:current（C11：与 `change` 同发）。 */
  'update:current': [current: number];
  /** 页码或 pageSize 变化（载荷与 antd 的 `onChange(page, pageSize)` 同形）。 */
  change: [current: number, pageSize: number];
  /** v-model:pageSize。 */
  'update:pageSize': [pageSize: number];
  /** 仅 pageSize 变化时（与 antd 的 `onShowSizeChange(current, size)` 同形）。 */
  showSizeChange: [current: number, size: number];
}

export interface PaginationSlots {
  /** 自定义页码 / 上下页 / 跳页的渲染（替代 `itemRender`）。 */
  itemRender?: (page: number, type: PaginationItemType, element: VNodeChild) => VNodeChild;
  /** 自定义「共 x 条」的渲染（替代 `showTotal`）。 */
  total?: (total: number, range: PaginationRange) => VNodeChild;
  /** 自定义尺寸切换器（替代 `components.sizeChanger` / `sizeChangerRender`）。 */
  sizeChanger?: (info: PaginationSizeChangerInfo) => VNodeChild;
}
