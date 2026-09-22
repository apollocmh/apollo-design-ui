/**
 * Alert 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/alert/{Alert,ErrorBoundary}.d.ts`。
 * **逐字段对齐**（名称、可选性、默认值、`@deprecated` 标记）。
 *
 * ── 与 antd 类型面的**有据可查**的差异 ────────────────────────────────────────
 *
 * 1. `React.CSSProperties` → Vue 的 `CSSProperties`，`React.ReactNode` → `VNodeChild`
 *    （规则 C16 / C18）。
 * 2. `ClosableType`（antd `_util/hooks`）：对象形态在 Vue 侧声明为
 *    `AlertClosable = { closeIcon?; onClose?; afterClose? } & Record<string, unknown>`
 *    —— antd 的对象形态会透传任意 aria-* / data-* 到关闭按钮（`pickAttrs` 过滤），
 *    `Record<string, unknown>` 表达这个开放集合。
 * 3. `AlertSemanticAllType` 是**手写**接口（empty / divider / skeleton 同条）。
 * 4. `onMouseEnter/onMouseLeave/onClick` 是 antd 的显式 props（Vue 侧以
 *    `onMouseenter` / `onMouseleave` / `onClick` 触发）。
 * 5. ErrorBoundary：React class 组件 → Vue `onErrorCaptured`；`children` 是默认
 *    插槽（C19）；`ErrorBoundaryProps` 增加 `class`（透传包装）不需要 —— 仅保留
 *    antd 声明的五个字段。
 */

import type { CSSProperties, VNodeChild } from 'vue';

import type { ComponentStyleConfig } from '../config-provider/context';

// ---------------------------------------------------------------------------
// 基础联合
// ---------------------------------------------------------------------------

/** 提示类型。与 antd 一致。 */
export type AlertType = 'success' | 'info' | 'warning' | 'error';

/** 形态。与 antd 的 `AlertVariant` 一致（6.4.0+）。 */
export type AlertVariant = 'outlined' | 'filled';

/**
 * `closable` 的对象形态。与 antd 的
 * `Exclude<ClosableType, boolean> & { onClose? }` 对齐：
 * `closeIcon` / `onClose` / `afterClose` 之外，任意 `aria-*` / `data-*`
 * 会被 pickAttrs 挑出落在关闭按钮上（所以有开放索引签名）。
 */
export interface AlertClosable {
  /** 自定义关闭图标（`true` ⇒ 默认 CloseOutlined）。 */
  closeIcon?: VNodeChild;
  /** 点击关闭按钮的回调。 */
  onClose?: (e: MouseEvent) => void;
  /** 收起动画结束后的回调。 */
  afterClose?: () => void;
  /** 开放的 aria-* / data-* 集合（经 pickAttrs 过滤后落 button）。 */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// 语义化（Alert.d.ts 的 AlertSemanticType）
// ---------------------------------------------------------------------------

export interface AlertSemanticClassNames {
  /** 根 `<div class="{prefixCls}">`。 */
  root?: string;
  /** 图标 `<span class="{prefixCls}-icon">`。 */
  icon?: string;
  /** 内容区 `<div class="{prefixCls}-section">`。 */
  section?: string;
  /** 标题 `<div class="{prefixCls}-title">`。 */
  title?: string;
  /** 描述 `<div class="{prefixCls}-description">`。 */
  description?: string;
  /** 操作区 `<div class="{prefixCls}-actions">`。 */
  actions?: string;
  /** 关闭按钮 `<button class="{prefixCls}-close-icon">`。 */
  close?: string;
}

export interface AlertSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  section?: CSSProperties;
  title?: CSSProperties;
  description?: CSSProperties;
  actions?: CSSProperties;
  close?: CSSProperties;
}

/** 语义化输入：对象或函数（对应 antd `GenerateSemantic<AlertSemanticType, AlertProps>`）。 */
export type AlertSemanticValue<T> = T | ((info: { props: AlertProps }) => T);

/** antd 的 `AlertSemanticAllType`（手写形态）。 */
export interface AlertSemanticAllType {
  classNames: AlertSemanticClassNames;
  classNamesAndFn: AlertSemanticValue<AlertSemanticClassNames>;
  styles: AlertSemanticStyles;
  stylesAndFn: AlertSemanticValue<AlertSemanticStyles>;
}

// ---------------------------------------------------------------------------
// AlertProps / AlertRef
// ---------------------------------------------------------------------------

/**
 * `Alert` 的 props。逐字段对齐 antd 的 `AlertProps`。
 *
 * ── 默认值（antd 判据）───────────────────────────────────────────────────────
 *
 * `type` 未传 ⇒ `banner ? 'warning' : 'info'`；`variant` ⇒ contextVariant ?? `'outlined'`；
 * banner 且未传 showIcon ⇒ **恒显图标**。
 */
export interface AlertProps {
  /** 提示类型。 */
  type?: AlertType;
  /** 形态（6.4.0+）。 */
  variant?: AlertVariant;
  /**
   * 是否可关闭。对象形态**恒可关**，且可携带 closeIcon / onClose / afterClose /
   * 任意 aria-*、data-*（经 pickAttrs 落到关闭按钮上）。
   */
  closable?: boolean | AlertClosable;
  /**
   * @deprecated 请用 `closable.closeIcon`。关闭文案（真值 ⇒ 可关）。
   */
  closeText?: VNodeChild;
  /** 标题内容。 */
  title?: VNodeChild;
  /**
   * @deprecated 请用 `title`。
   */
  message?: VNodeChild;
  /** 辅助描述（有值 ⇒ `-with-description`）。 */
  description?: VNodeChild;
  /**
   * @deprecated 请用 `closable.onClose`。
   */
  onClose?: (e: MouseEvent) => void;
  /**
   * @deprecated 请用 `closable.afterClose`。
   */
  afterClose?: () => void;
  /** 是否显示图标（banner 且未传 ⇒ true）。 */
  showIcon?: boolean;
  /** 根元素 role（默认 `'alert'`，可覆盖）。 */
  role?: string;
  /** 类名前缀。 */
  prefixCls?: string;
  /** 落在根元素上。 */
  className?: string;
  /** 也落在根元素上。 */
  rootClassName?: string;
  /** 根元素内联样式（参与语义化合并）。 */
  style?: CSSProperties;
  /** 顶部通告形态（边框/圆角清零、默认 warning + 图标）。 */
  banner?: boolean;
  /** 自定义图标（覆盖默认类型图标）。 */
  icon?: VNodeChild;
  /**
   * @deprecated 请用 `closable.closeIcon`。`null` / `false` ⇒ **不可关**。
   */
  closeIcon?: VNodeChild;
  /** 操作区（`-actions` 区块）。 */
  action?: VNodeChild;
  /** 根元素 id。 */
  id?: string;
  /** 根元素 mouseenter。 */
  onMouseenter?: (e: MouseEvent) => void;
  /** 根元素 mouseleave。 */
  onMouseleave?: (e: MouseEvent) => void;
  /** 根元素 click。 */
  onClick?: (e: MouseEvent) => void;
  /** 语义化类名。 */
  classNames?: AlertSemanticValue<AlertSemanticClassNames>;
  /** 语义化样式。 */
  styles?: AlertSemanticValue<AlertSemanticStyles>;
}

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的 `AlertRef` 有一处差异（PLATFORM）：antd 声明
 *    `nativeElement: HTMLDivElement`，但首次渲染前它同样是 `null`，只是类型没体现。
 *    我们按真实情况声明为可空（Divider / StatisticRef 同一条理由）。
 */
export interface AlertRef {
  nativeElement: HTMLDivElement | null;
}

// ---------------------------------------------------------------------------
// ErrorBoundary
// ---------------------------------------------------------------------------

/** `Alert.ErrorBoundary` 的 props。与 antd 的 `ErrorBoundaryProps` 一致（children → 插槽）。 */
export interface ErrorBoundaryProps {
  /** 错误告警的标题（缺省用 `error.toString()`）。 */
  title?: VNodeChild;
  /**
   * @deprecated 请用 `title`。
   */
  message?: VNodeChild;
  /** 错误描述（缺省用组件栈，渲染在 `<pre>` 里）。 */
  description?: VNodeChild;
  /** 透传给 Alert 的 id。 */
  id?: string;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Alert 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider` 的 `alert` 配置。与 antd 的
 * `AlertConfig = ComponentStyleConfig & Pick<AlertProps,'variant'|'closable'|'closeIcon'|'classNames'|'styles'>`
 * 加四种类型图标覆盖一致。
 */
export interface AlertConfig
  extends ComponentStyleConfig,
    Pick<AlertProps, 'variant' | 'closable' | 'closeIcon' | 'classNames' | 'styles'> {
  /** success 类型的默认图标（覆盖 CheckCircleFilled）。 */
  successIcon?: VNodeChild;
  /** info 类型的默认图标（覆盖 InfoCircleFilled）。 */
  infoIcon?: VNodeChild;
  /** warning 类型的默认图标（覆盖 ExclamationCircleFilled）。 */
  warningIcon?: VNodeChild;
  /** error 类型的默认图标（覆盖 CloseCircleFilled）。 */
  errorIcon?: VNodeChild;
}
