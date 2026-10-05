/**
 * Descriptions 的类型定义（Vue API）。
 *
 * 契约来源：antd 6.6.4 的 `es/descriptions/index.d.ts`（DescriptionsProps extends
 * `Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>`）。判据逐条对齐 G1 分析
 * （`docs/analysis/descriptions.md`）。
 */

import type { VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';

/** 列数：数字，或响应式映射（未激活任何断点时落 DEFAULT_COLUMN_MAP）。 */
export type DescriptionsColumn = number | Partial<Record<Breakpoint, number>>;

/**
 * 单条描述的 span：数字；`'filled'`（独占一行并参与行尾补齐）；
 * 或响应式映射（useItems 里 matchScreen 解析，无激活断点 ⇒ undefined ⇒ 按 1 处理）。
 */
export type DescriptionsItemSpan = number | 'filled' | Partial<Record<Breakpoint, number>>;

export interface DescriptionsItemType {
  key?: string | number;
  /** 条目标签。 */
  label?: VNodeChild;
  /** 条目内容。 */
  children?: VNodeChild;
  /** 占格数（默认 1；`'filled'` 独占一行）。 */
  span?: DescriptionsItemSpan;
  prefixCls?: string;
  className?: string;
  style?: Record<string, string | number>;
  /** ⚠️ deprecated：用 `styles.label`。 */
  labelStyle?: Record<string, string | number>;
  /** ⚠️ deprecated：用 `styles.content`。 */
  contentStyle?: Record<string, string | number>;
  styles?: {
    label?: Record<string, string | number>;
    content?: Record<string, string | number>;
  };
  classNames?: {
    label?: string;
    content?: string;
  };
}

/** 语义化槽位（对象或函数式，与 antd 的 `GenerateSemantic` 同构）。 */
export interface DescriptionsSemanticClassNames {
  root?: string;
  header?: string;
  title?: string;
  extra?: string;
  label?: string;
  content?: string;
}

export interface DescriptionsSemanticStyles {
  root?: Record<string, string | number>;
  header?: Record<string, string | number>;
  title?: Record<string, string | number>;
  extra?: Record<string, string | number>;
  label?: Record<string, string | number>;
  content?: Record<string, string | number>;
}

export interface DescriptionsProps {
  prefixCls?: string;
  id?: string;
  /** 边框形态。默认 `false`。 */
  bordered?: boolean;
  /**
   * 尺寸。⚠️ `'default'` 已废弃（提示改 `'large'`）—— 类名只对
   * medium/middle → `-medium`、small → `-small`，large/default 无类。
   */
  size?: 'large' | 'medium' | 'small' | 'default' | 'middle';
  /** ⚠️ deprecated：用 `items`（`Descriptions.Item` 子节点形态仍支持）。 */
  title?: string;
  /** ⚠️ 已改为 `#extra` slot（空 slot 等价隐藏）。 */
  extra?: never;
  /** 列数（数字或响应式映射）。 */
  column?: DescriptionsColumn;
  /** 布局方向。默认 `'horizontal'`。 */
  layout?: 'horizontal' | 'vertical';
  /** label 冒号。默认 `true`。 */
  colon?: boolean;
  /** ⚠️ deprecated：用 `styles.label`。 */
  labelStyle?: Record<string, string | number>;
  /** ⚠️ deprecated：用 `styles.content`。 */
  contentStyle?: Record<string, string | number>;
  /** 首选 API：条目数组。 */
  items?: DescriptionsItemType[];
  /** ⚠️ deprecated：用 `items`。 */
  children?: VNodeChild;
  classNames?:
    | DescriptionsSemanticClassNames
    | ((props: DescriptionsProps) => DescriptionsSemanticClassNames);
  styles?: DescriptionsSemanticStyles | ((props: DescriptionsProps) => DescriptionsSemanticStyles);
}

/** ref 形状（与 antd 一致：只有 nativeElement）。 */
export interface DescriptionsRef {
  nativeElement: HTMLDivElement | null;
}

/** 行切分产物：一行内的 items（补齐后的 span 已写入）。 */
export interface DescriptionsRowItem {
  label?: VNodeChild;
  children?: VNodeChild;
  span?: number;
  filled?: boolean;
  prefixCls?: string;
  className?: string;
  style?: Record<string, string | number>;
  labelStyle?: Record<string, string | number>;
  contentStyle?: Record<string, string | number>;
  styles?: { label?: Record<string, string | number>; content?: Record<string, string | number> };
  classNames?: { label?: string; content?: string };
  key?: string | number;
  index: number;
}
