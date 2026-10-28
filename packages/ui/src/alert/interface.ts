/** Current Apollo Alert data, Vue events, complete content slots and configuration. */

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
  closeText?: string;
  /** 标题内容（prop 收窄 string，或通过 `#title` 插槽传入富内容）。 */
  title?: string;
  /**
   * @deprecated 请用 `title`。
   */
  message?: string;
  /** 辅助描述（有值 ⇒ `-with-description`；prop 收窄 string，或 `#description` 插槽）。 */
  description?: string;
  /** Vue close 事件监听器；载荷为实际关闭按钮产生的 MouseEvent。 */
  onClose?: (e: MouseEvent) => void;
  /** Vue after-close 事件：内部关闭完成并移除后触发。 */
  onAfterClose?: () => void;
  /**
   * @deprecated 请用 Vue `@after-close`；配置对象仍可携带业务 afterClose。
   */
  afterClose?: () => void;
  /** 是否显示图标（banner 且未传 ⇒ true）。 */
  showIcon?: boolean;
  /** 根元素 role（默认 `'alert'`，可覆盖）。 */
  role?: string;
  /** 类名前缀。 */
  prefixCls?: string;
  /** 顶部通告形态（边框/圆角清零、默认 warning + 图标）。 */
  banner?: boolean;
  /**
   * @deprecated 请用 `closable.closeIcon`。`null` / `false` ⇒ **不可关**。
   */
  closeIcon?: string | number | boolean | null;
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

/** Full native Vue content; present empty slots suppress their fallback. */
export interface AlertSlots {
  title?: () => VNodeChild;
  description?: () => VNodeChild;
  icon?: () => VNodeChild;
  action?: () => VNodeChild;
  closeIcon?: () => VNodeChild;
}

/** Healthy boundary content remains a fragment without an extra DOM wrapper. */
export interface ErrorBoundarySlots {
  default?: () => VNodeChild;
}

// ---------------------------------------------------------------------------
// ErrorBoundary
// ---------------------------------------------------------------------------

/** ErrorBoundary 的 VNode 数据；健康内容通过默认 slot 传入。 */
export interface ErrorBoundaryProps {
  /** 错误告警的标题（缺省用 `String(error)`，包括任意抛出值）。 */
  title?: VNodeChild;
  /**
   * @deprecated 请用 `title`。
   */
  message?: VNodeChild;
  /** 错误描述（缺省以可聚焦 `<pre>` 展示 Vue 错误阶段信息）。 */
  description?: VNodeChild;
  /** 透传给 Alert 的 id。 */
  id?: string;
}

// ---------------------------------------------------------------------------
// ConfigProvider 上的 Alert 配置
// ---------------------------------------------------------------------------

/**
 * `ConfigProvider.components.alert` 配置。历史参考为 antd 的
 * `AlertConfig = ComponentStyleConfig & Pick<AlertProps,'variant'|'closable'|'closeIcon'|'classNames'|'styles'>`
 * 加四种类型图标覆盖一致。
 */
export interface AlertConfig
  extends ComponentStyleConfig,
    Pick<AlertProps, 'variant' | 'closable' | 'classNames' | 'styles'> {
  /**
   * 程序化上下文：ConfigProvider 可传入 VNode 关闭图标（规则 #5：保留）。
   * 注意：公开 prop `AlertProps.closeIcon` 已收窄为非 VNode，此处为内部配置专属类型。
   */
  closeIcon?: VNodeChild;
  /** success 类型的默认图标（覆盖 CheckCircleFilled）。 */
  successIcon?: VNodeChild;
  /** info 类型的默认图标（覆盖 InfoCircleFilled）。 */
  infoIcon?: VNodeChild;
  /** warning 类型的默认图标（覆盖 ExclamationCircleFilled）。 */
  warningIcon?: VNodeChild;
  /** error 类型的默认图标（覆盖 CloseCircleFilled）。 */
  errorIcon?: VNodeChild;
}
