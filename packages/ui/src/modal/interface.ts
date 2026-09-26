/**
 * Modal 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/modal/interface.ts`（`ModalProps` / `ModalFuncProps` /
 * `ModalSemanticType` / `ModalLocale` / `MousePosition`）+ `@rc-component/dialog@1.10.0`
 * 的 `IDialogPropTypes`（`es/IDialogPropTypes.d.ts`）。
 *
 * 按本仓 Vue 化约定重新定义（H2，不搬运）：
 *   - `React.ReactNode` ⇒ `VNodeChild`；`React.CSSProperties` ⇒ `CSSProperties`；
 *   - `SyntheticEvent | KeyboardEvent` ⇒ `Event`（DOM 事件）；
 *   - `visible` ⇒ `open`（上游 antd 侧已改名，rc 侧仍叫 `visible`）；
 *   - 语义槽的**函数式形态**（`GenerateSemantic`）本仓未落地 ⇒ 只保留对象形态（D36 同判）；
 *   - 命令式的 `destroy` / `update` 由 `confirm` 返回（见 `ModalInstance`）。
 *
 * ⚠️ 与 antd 的 `extends` 结构对应关系（便于逐条核对）：
 *   `ModalProps = Omit<RcDialogProps, 'footer'|'width'|'onClose'|'animation'|'maskAnimation'|
 *    'transitionName'|'maskTransitionName'|'mask'|'classNames'|'styles'|OmitFocusType>`
 *   + antd 自有字段。本仓不引 rc 类型（R7），把 rc 侧**未 omit** 的字段逐条展开写在这里。
 */

import type { CSSProperties, VNodeChild } from 'vue';

// ---------------------------------------------------------------------------
// 复用 _internal 的单一真源（三次法则后的落点）
// ---------------------------------------------------------------------------
import type { ClosableType } from '../_internal/use-closable';
import type { MaskType } from '../_internal/use-merged-mask';

export type { ClosableConfig, ClosableType } from '../_internal/use-closable';
export type { MaskConfig, MaskType } from '../_internal/use-merged-mask';

/** `getContainer` 的形态（rc 的 `GetContainer | false`）。 */
export type ModalGetContainer = string | HTMLElement | (() => HTMLElement) | false | undefined;

/** 鼠标位置（`mousePosition`）—— 有值时 zoom 动效从该点展开。 */
export type MousePosition = { x: number; y: number } | null;

/**
 * `focusable` 的配置（antd `drawer/useFocusable.ts` 的 `FocusableConfig`）。
 *
 * ⚠️ `autoFocusButton` **只在 `ModalFuncProps` 里出现**（`ModalProps.focusable` 不带它）。
 */
export interface FocusableConfig {
  /** 关闭后是否把焦点还给触发元素。默认 `true`。 */
  focusTriggerAfterClose?: boolean;
  /** 是否做焦点陷阱。默认跟着 `mask` 走。 */
  trap?: boolean;
}

/** 确认框的默认聚焦按钮。⚠️ 显式 `null` = **不自动聚焦**（与 `undefined` 不同）。 */
export type AutoFocusButton = null | 'ok' | 'cancel';

/** 确认框的类型。`warn` 与 `warning` 同义（上游两者都映射到 `'warning'`）。 */
export type ModalType = 'info' | 'success' | 'error' | 'warn' | 'warning' | 'confirm';

/** OK 按钮的类型（antd 的 `LegacyButtonType` = `ButtonType | 'danger'`）。 */
export type ModalOkType = 'text' | 'link' | 'primary' | 'default' | 'dashed' | 'danger';

/**
 * 语义槽的**运行时输入**形态 —— 对象，或函数（`(info) => slots`）。
 *
 * ⚠️ 为什么单列一个类型：`useMergeSemantic` 的 `resolveSemantic` **运行时支持函数形态**，
 *    但 prop 的 `PropType` 若只声明对象形态，vue-tsc 会把模板里的 `:styles="fn"` 判成
 *    不可赋值（modal 的 `style-class` demo 实测）。
 *    公开的 `ModalSemanticType` 仍按 D36 只声明对象形态；这个只给 prop 的 `PropType` 用。
 *
 * ⚠️ 函数形态的入参用 `Record<string, unknown>` 而不是 `ModalProps` ——
 *    要能直接喂给 `useMergeSemantic<Record<string, unknown>, …>` 的
 *    `SemanticInput`（它要求 `(info: SemanticInfo<P>) => …`，P 是调用方选的）。
 *    传 `ModalProps` 会因为**参数逆变**不可赋值。
 */
export interface ModalSemanticTypeInput {
  classNames?:
    | ModalSemanticType['classNames']
    | ((info: { props: Record<string, unknown> }) => ModalSemanticType['classNames']);
  styles?:
    | ModalSemanticType['styles']
    | ((info: { props: Record<string, unknown> }) => ModalSemanticType['styles']);
}

/**
 * 9 个语义槽。
 *
 * ⚠️ `body` / `mask` 在 `ConfirmDialog` 里被 `_semanticOmit` 摘掉后**改挂到
 *    `{p}-confirm-content` 上**（见 `ConfirmDialog` 的 `_renderSemanticContent`）。
 */
export interface ModalSemanticType {
  classNames?: {
    root?: string;
    header?: string;
    body?: string;
    footer?: string;
    container?: string;
    title?: string;
    wrapper?: string;
    mask?: string;
    close?: string;
  };
  styles?: {
    root?: CSSProperties;
    header?: CSSProperties;
    body?: CSSProperties;
    footer?: CSSProperties;
    container?: CSSProperties;
    title?: CSSProperties;
    wrapper?: CSSProperties;
    mask?: CSSProperties;
    close?: CSSProperties;
  };
}

/**
 * 面板（`Panel`）的 props —— rc-dialog 侧，本仓内部使用。
 *
 * ⚠️ 本仓**不导出**它（`Panel` 只在 `_InternalPanelDoNotUseOrYouWillBeFired` 里出现）。
 */
export interface ModalPanelProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  title?: VNodeChild;
  ariaId?: string;
  footer?: VNodeChild;
  closable?: boolean | (ClosableType & Record<string, unknown>);
  closeIcon?: VNodeChild;
  onClose?: (e: Event) => void;
  children?: VNodeChild;
  bodyStyle?: CSSProperties;
  bodyProps?: Record<string, unknown>;
  modalRender?: (node: VNodeChild) => VNodeChild;
  visible?: boolean;
  forceRender?: boolean;
  width?: string | number;
  height?: string | number;
  classNames?: ModalSemanticType['classNames'];
  styles?: ModalSemanticType['styles'];
  /** 容器 `position` 是否为 `fixed`（焦点陷阱的门控之一）。 */
  isFixedPos?: boolean;
  focusTrap?: boolean;
}

/**
 * `Modal` 的 props。
 *
 * 分组：① rc-dialog 侧（本仓不引 rc 类型，逐条展开）；② antd 自有；③ deprecated。
 */
export interface ModalProps {
  // ------------------------- ① rc-dialog 侧（未 omit 的） -------------------------
  /** 是否显示（rc 的 `visible`）。 */
  open?: boolean;
  prefixCls?: string;
  /** 面板类名。 */
  className?: string;
  rootClassName?: string;
  rootStyle?: CSSProperties;
  /** 面板内联样式。⚠️ `rootStyle` 才是根节点。 */
  style?: CSSProperties;
  wrapClassName?: string;
  /** @deprecated rc 侧：请用 `classNames.wrapper` + `styles.wrapper`。 */
  wrapStyle?: Record<string, unknown>;
  wrapProps?: Record<string, unknown>;
  maskProps?: Record<string, unknown>;
  bodyProps?: Record<string, unknown>;
  /** @deprecated rc 侧：请用 `styles.body`。 */
  bodyStyle?: CSSProperties;
  width?: string | number | Partial<Record<ModalBreakpoint, string | number>>;
  height?: string | number;
  zIndex?: number;
  getContainer?: ModalGetContainer;
  forceRender?: boolean;
  /** ESC 是否可关。默认 `true`。 */
  keyboard?: boolean;
  /** 打开时是否锁 body 滚动。默认 `true`。 */
  scrollLock?: boolean;
  /** 动效结束（开与关都触发）。 */
  afterOpenChange?: (open: boolean) => void;
  /** 关闭动效结束。 */
  afterClose?: () => void;
  /** 点遮罩 / 右上角 × / 取消按钮 / ESC 都走它。 */
  onCancel?: (e: Event) => void;
  /** 关闭图标的节点（`closable` 为真时生效）。 */
  closeIcon?: VNodeChild;
  /** 自定义面板渲染（包一层 `{p}-render`）。 */
  modalRender?: (node: VNodeChild) => VNodeChild;
  /** 打开时从该鼠标位置展开 zoom 动效。 */
  mousePosition?: MousePosition;
  /** 面板根节点（透传给 watermark 等）。 */
  panelRef?: unknown;
  /** @deprecated rc 侧：请用 `focusable.focusTriggerAfterClose`。 */
  focusTriggerAfterClose?: boolean;
  /** @deprecated rc 侧：请用 `focusable.trap`。 */
  focusTrap?: boolean;

  // ------------------------------ ② antd 自有 ------------------------------
  /** 标题区。 */
  title?: VNodeChild;
  /**
   * 底部区。传函数时收到 `(originNode, { OkBtn, CancelBtn })`。
   * ⚠️ 传 `null` 表示**不渲染 footer**。
   */
  footer?: VNodeChild | ((originNode: VNodeChild, extra: ModalFooterExtra) => VNodeChild);
  /** OK 按钮文案（默认取 locale 的 `okText`）。 */
  okText?: VNodeChild;
  /** 取消按钮文案（默认取 locale 的 `cancelText`）。 */
  cancelText?: VNodeChild;
  /** OK 按钮类型。默认 `'primary'`。 */
  okType?: ModalOkType;
  /** OK 按钮 loading。 */
  confirmLoading?: boolean;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  /** 点 OK 的回调。 */
  onOk?: (e: Event) => void;
  /** 内容区骨架态（此时 footer 强制不渲染）。 */
  loading?: boolean;
  /** 垂直居中。 */
  centered?: boolean;
  /** 关闭按钮（`false` 隐藏；对象形态可带 `disabled` / `onClose` / `afterClose`）。 */
  closable?:
    | boolean
    | (Exclude<ClosableType, boolean> & {
        onClose?: () => void;
        afterClose?: () => void;
      });
  /** 遮罩（对象形态见 `MaskType`）。 */
  mask?: MaskType;
  /** 关闭后是否卸载内容。 */
  destroyOnHidden?: boolean;
  /** 焦点行为。 */
  focusable?: FocusableConfig;
  classNames?: ModalSemanticType['classNames'];
  styles?: ModalSemanticType['styles'];

  // ------------------------------ ③ deprecated ------------------------------
  /** @deprecated 请用 `mask.closable`。 */
  maskClosable?: boolean;
  /** @deprecated 请用 `destroyOnHidden`。 */
  destroyOnClose?: boolean;
  /** @deprecated 请用 `styles.mask`。 */
  maskStyle?: CSSProperties;
}

/** `footer` 函数形态的第二参（两个预设按钮）。 */
export interface ModalFooterExtra {
  OkBtn: unknown;
  CancelBtn: unknown;
}

/**
 * 按钮的 props。
 *
 * ⚠️ 本仓不引同包 `Button` 的 `ButtonProps`（会构成同包循环引用），用结构化描述；
 *    实际使用时会透传给 `Button`。
 */
export interface ModalButtonProps {
  type?: ModalOkType;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  ghost?: boolean;
  onClick?: (e: MouseEvent) => void;
  [key: string]: unknown;
}

/** antd 的 `Breakpoint`（响应式 width 的键）。 */
export type ModalBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

/** `Modal` 的 locale（三个键）。 */
export interface ModalLocale {
  okText: string;
  cancelText: string;
  justOkText: string;
}

/**
 * `Modal.confirm/info/success/error/warning` 的参数。
 *
 * ⚠️ 与 `ModalProps` 的差异（上游逐字）：多了 `content` / `icon` / `okCancel` / `type` /
 *    `direction` / `autoFocusButton`，且 `width` 只收 `string | number`（无响应式对象）。
 */
export interface ModalFuncProps extends Omit<ModalProps, 'width' | 'children' | 'onOk' | 'footer'> {
  width?: string | number;
  /** 正文（对应 `ModalProps` 的 `children`）。 */
  content?: VNodeChild;
  /** 自定义图标。`null` / `false` 显式隐藏默认图标。 */
  icon?: VNodeChild;
  type?: ModalType;
  /** 是否显示取消按钮。默认 `type === 'confirm'`。 */
  okCancel?: boolean;
  /** @deprecated 请用 `focusable.autoFocusButton`。 */
  autoFocusButton?: AutoFocusButton;
  focusable?: FocusableConfig & { autoFocusButton?: AutoFocusButton };
  /** 文字方向（命令式路径没有组件上下文，靠它显式指定）。 */
  direction?: 'ltr' | 'rtl';
  onOk?: (...args: unknown[]) => unknown;
  onCancel?: (...args: unknown[]) => unknown;
  footer?: ModalProps['footer'];
}

/**
 * 命令式实例（`Modal.confirm(...)` / `useModal()` 的返回值）。
 *
 * ⚠️ `destroy` 是**关闭**（走动效 + `afterClose` 后卸载），不是立即卸载。
 */
export interface ModalInstance {
  destroy: () => void;
  update: (config: Partial<ModalFuncProps> | ((prev: ModalFuncProps) => ModalFuncProps)) => void;
}

/**
 * `useModal()` 返回的 6 个方法。
 * ⚠️ `warning` 与 `warn` 是**同一个函数**（上游 `modalWarn`）。
 */
export interface ModalHookAPI {
  info: (props: ModalFuncProps) => ModalInstance;
  success: (props: ModalFuncProps) => ModalInstance;
  error: (props: ModalFuncProps) => ModalInstance;
  warning: (props: ModalFuncProps) => ModalInstance;
  warn: (props: ModalFuncProps) => ModalInstance;
  confirm: (props: ModalFuncProps) => ModalInstance;
}

/** `Modal.config` 的参数（**已废弃**，指向 `ConfigProvider.config`）。 */
export interface ModalGlobalConfig {
  rootPrefixCls?: string;
}

/** `_InternalPanelDoNotUseOrYouWillBeFired` 的 props。 */
export interface ModalPurePanelProps {
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  closable?: boolean | (ClosableType & Record<string, unknown>);
  closeIcon?: VNodeChild;
  type?: ModalType;
  title?: VNodeChild;
  children?: VNodeChild;
  footer?: VNodeChild | ((originNode: VNodeChild, extra: ModalFooterExtra) => VNodeChild);
  classNames?: ModalSemanticType['classNames'];
  styles?: ModalSemanticType['styles'];
  /** confirm 形态的正文（`type` 有值时用）。 */
  content?: VNodeChild;
}
