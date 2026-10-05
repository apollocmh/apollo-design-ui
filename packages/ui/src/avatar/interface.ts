/**
 * Avatar 的类型面（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的
 * `es/avatar/Avatar.d.ts` / `AvatarGroup.d.ts` / `AvatarContext.d.ts` / `index.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值、`@deprecated` 标记）。
 * 有意差异见 `packages/ui/src/avatar/README.md` §2 与 `COMPATIBILITY.md` §9。
 *
 * ── 与 antd 类型面的四处**有据可查**的差异 ────────────────────────────────────
 *
 * 1. `children` 不在任何 Props 里（规则 C19）—— antd 的 `React.ReactNode` 在 Vue 侧是
 *    默认插槽：`Avatar` 的 `AvatarSlot`、`Avatar.Group` 的 `AvatarGroupSlot`。
 * 2. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。`React.HTMLAttributes<HTMLSpanElement>` 在 Vue 侧是 **attrs**
 *    （`inheritAttrs`），不进 Props。
 * 3. `AvatarRef.nativeElement` 声明为**可空**（上游声明非空，但首帧前同样是 `null`，
 *    与 `SkeletonRef` / `CardRef` 同一条理由）。
 * 4. `AvatarConfig` 是 **`ComponentStyleConfig`**（只有 `className` / `style`）——
 *    ⚠️ 与 card / empty 不同：**`Avatar` 没有 `classNames` / `styles` 语义化槽**
 *    （上游没有 `AvatarSemanticType`），所以配置面比它们窄。
 *
 * ── 一处**刻意保留**的上游形状 ────────────────────────────────────────────────
 *
 * `onError?: () => boolean` 是**有返回值语义**的回调 prop（返回 `false` ⇒ 阻止内置回退，
 * 见 `Avatar.tsx:108-113` 的 `!== false` 判据）。它不是事件，本仓保持 prop 形态。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { Breakpoint } from '../_internal/responsive-observer';
import type { ComponentStyleConfig } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { PopoverProps } from '../popover/interface';

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 形状。 */
export type AvatarShape = 'circle' | 'square';

/**
 * 响应式尺寸表：断点 → 像素尺寸。
 *
 * ⚠️ 键是 `responsiveArray` 的成员（`xxxl` / `xxl` / `xl` / `lg` / `md` / `sm` / `xs`），
 * **从大到小**（与上游 `ScreenSizeMap` 一致）。
 */
export type ScreenSizeMap = Partial<Record<Breakpoint, number>>;

/**
 * 头像尺寸。
 *
 * `SizeType | 'default' | number | ScreenSizeMap` —— 逐字来自上游：
 * `'default'` 已废弃（用 `'medium'`，传了会告警）；`number` 是**像素数**；
 * `ScreenSizeMap` 走**响应式**分支（按 `useBreakpoint` 的当前断点取）。
 */
export type AvatarSize = SizeType | 'default' | number | ScreenSizeMap;

/** `AvatarContext` 的值（由 `Avatar.Group` 注入给子 `Avatar`）。与上游一致。 */
export interface AvatarContextType {
  size?: AvatarSize;
  shape?: AvatarShape;
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

/**
 * `Avatar` 的 props。逐字段对齐 antd 的 `AvatarProps`。
 *
 * ⚠️ 上游的 `extends React.HTMLAttributes<HTMLSpanElement>` 在 Vue 侧落进 **attrs**
 *    （`inheritAttrs`），不进本接口。
 */
export interface AvatarProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** 形状。不传时取 `AvatarContext.shape`，再兜底 `'circle'`。 */
  shape?: AvatarShape;
  /** 尺寸。解析链见 `docs/analysis/avatar.md` §2.6。 */
  size?: AvatarSize;
  /**
   * 字符型头像的**左右留白**（像素）。
   *
   * ⚠️ 上游默认值是 `4`（解构默认），且它**同时**是缩放的阈值参数：
   * `gap * 2 < nodeWidth` 才做缩放，目标宽度是 `nodeWidth - gap * 2`。
   */
  gap?: number;
  /**
   * 图片来源。
   *
   * - **字符串** ⇒ 渲染 `<img src>`（加载失败时按 `onError` 的返回值决定是否回退）
   * - **vnode** ⇒ **原样渲染**（不做 `<img>` 包装）
   * - 其余 ⇒ 走 `icon` / `children` 分支
   */
  src?: VNodeChild;
  /** `<img>` 的 `srcset`。 */
  srcSet?: string;
  /** `<img>` 的 `draggable`。 */
  draggable?: boolean | 'true' | 'false';
  /** 图标。 */
  icon?: VNodeChild;
  /** `<img>` 的 `alt`。 */
  alt?: string;
  /** `<img>` 的 `crossorigin`。 */
  crossOrigin?: '' | 'anonymous' | 'use-credentials';
  /**
   * 点击回调。
   *
   * ⚠️ 上游是 `onClick?: (e?: React.MouseEvent<HTMLElement>) => void` ——
   *    **prop**（不是 emits）。本仓保持 prop 形态（与 `anchor` 的 `onClick` 同判）。
   */
  onClick?: (e?: MouseEvent) => void;
  /**
   * 图片加载失败回调。
   *
   * ⚠️ **有返回值语义**：返回 `false` ⇒ **阻止**内置回退（不再把 `-image` 摘掉）。
   *    判据是 `!== false`（不是真值）⇒ 返回 `undefined` / `0` / `''` 都**会**回退。
   */
  onError?: () => boolean;
}

/** `Avatar` 暴露的实例。 */
export interface AvatarRef {
  nativeElement: HTMLSpanElement | null;
}

/** `Avatar` 的默认插槽。antd 的 `children` 在 Vue 侧即此插槽。 */
export type AvatarSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// Avatar.Group
// ---------------------------------------------------------------------------

/**
 * `Avatar.Group` 的 `max` 配置。
 *
 * ⚠️ 上游的展开顺序是 `{ content: childrenHidden, ...max.popover, placement, trigger, rootClassName }`
 * ⇒ `max.popover` 里的 `content` **覆盖** `childrenHidden`，而
 * `placement` / `trigger` / `rootClassName` 又**覆盖** `max.popover` 里的同名键。
 */
export interface AvatarGroupMax {
  /** 最多显示几个（其余进 Popover）。 */
  count?: number;
  /** 「+N」那个头像的样式。 */
  style?: CSSProperties;
  /** 溢出 Popover 的 props。 */
  popover?: PopoverProps;
}

/**
 * `Avatar.Group` 的 props。逐字段对齐 antd 的 `AvatarGroupProps`。
 *
 * ⚠️ 上游的 `extends React.HTMLAttributes<HTMLDivElement>` 在 Vue 侧是 attrs。
 */
export interface AvatarGroupProps {
  /** 类名前缀。不传则从 ConfigProvider 取，兜底 `apollo`。 */
  prefixCls?: string;
  /** @deprecated 请用 `max={{ count }}`。 */
  maxCount?: number;
  /** @deprecated 请用 `max={{ style }}`。 */
  maxStyle?: CSSProperties;
  /** @deprecated 请用 `max={{ popover }}`。 */
  maxPopoverPlacement?: 'top' | 'bottom';
  /** @deprecated 请用 `max={{ popover }}`。 */
  maxPopoverTrigger?: 'hover' | 'focus' | 'click';
  /** 溢出配置。 */
  max?: AvatarGroupMax;
  /** 透传给所有子 `Avatar` 的尺寸（经 `AvatarContext`）。 */
  size?: AvatarSize;
  /** 透传给所有子 `Avatar` 的形状（经 `AvatarContext`）。 */
  shape?: AvatarShape;
}

/** `Avatar.Group` 暴露的实例。 */
export interface AvatarGroupRef {
  nativeElement: HTMLDivElement | null;
}

/** `Avatar.Group` 的默认插槽。 */
export type AvatarGroupSlot = () => VNodeChild;

// ---------------------------------------------------------------------------
// ConfigProvider 上的配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `avatar` 配置。与 antd 的 `AvatarConfig` 一致。
 *
 * ⚠️ **只有 `className` / `style`** —— `Avatar` 没有 `classNames` / `styles` 语义化槽
 * （与 card / empty / skeleton 不同）。
 *
 * ⚠️ 与 anchor / masonry / card 一致：走 (B) 通道，**类型未提升**进 `ConfigProvider`
 * 的 (A) 通道 —— 运行时可用，只是类型宽。
 */
export type AvatarConfig = ComponentStyleConfig;
