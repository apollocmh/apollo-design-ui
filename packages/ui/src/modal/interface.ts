import type { GetContainer } from '@apollo-design/portal';
import type { ClassValue, CSSProperties, FunctionalComponent, Ref, VNodeChild } from 'vue';
// ---------------------------------------------------------------------------
// 复用 _internal 的单一真源（三次法则后的落点）
// ---------------------------------------------------------------------------
import type { SemanticInput } from '../_internal/use-merge-semantic';
import type { MaskType } from '../_internal/use-merged-mask';
import type ConfirmCancelBtn from './components/ConfirmCancelBtn';
import type ConfirmOkBtn from './components/ConfirmOkBtn';
import type NormalCancelBtn from './components/NormalCancelBtn';
import type NormalOkBtn from './components/NormalOkBtn';

export type { ClosableConfig, ClosableType } from '../_internal/use-closable';
export type { MaskConfig, MaskType } from '../_internal/use-merged-mask';

/** `getContainer` 的形态（rc 的 `GetContainer | false`）。 */
export type ModalGetContainer = GetContainer;

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

/** Public semantics always receive the current public props. */
export interface ModalSemanticTypeInput {
  classNames?: SemanticInput<ModalSemanticType['classNames'], ModalProps>;
  styles?: SemanticInput<ModalSemanticType['styles'], ModalProps>;
}

export interface ModalClosableConfig {
  closeIcon?: VNodeChild;
  disabled?: boolean;
  onClose?: () => void;
  afterClose?: () => void;
  'aria-label'?: string;
  [key: string]: unknown;
}
export type ModalPanelRef = Ref<HTMLElement | null> | ((element: HTMLElement | null) => void);
export type ModalEmits = {
  'update:open': [open: boolean];
  ok: [event: Event];
  cancel: [event: Event];
  afterClose: [];
  afterOpenChange: [open: boolean];
};
export interface ModalRenderSlotProps {
  ModalPanel: FunctionalComponent;
}
export type ModalSlots = {
  default?: () => VNodeChild;
  title?: () => VNodeChild;
  okText?: () => VNodeChild;
  cancelText?: () => VNodeChild;
  closeIcon?: () => VNodeChild;
  footer?: (scope: ModalFooterExtra) => VNodeChild;
  modalRender?: (scope: ModalRenderSlotProps) => VNodeChild;
};

/**
 * 9 个语义槽。
 *
 * `body` 在 `ConfirmDialog` 里被 `_semanticOmit` 摘掉后**改挂到
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
 * `Modal` 的 props。
 *
 * 分组：① rc-dialog 侧（本仓不引 rc 类型，逐条展开）；② antd 自有；③ deprecated。
 */
export interface ModalProps extends ModalSemanticTypeInput {
  // ------------------------- ① rc-dialog 侧（未 omit 的） -------------------------
  /** 是否显示（rc 的 `visible`）。 */
  open?: boolean;
  prefixCls?: string;
  /** 根节点内联样式。 */
  rootStyle?: CSSProperties;
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
  /** 打开时从该鼠标位置展开 zoom 动效。 */
  mousePosition?: MousePosition;
  /** 面板根节点（透传给 watermark 等）。 */
  panelRef?: ModalPanelRef;
  /** @deprecated rc 侧：请用 `focusable.focusTriggerAfterClose`。 */
  focusTriggerAfterClose?: boolean;

  // ------------------------------ ② antd 自有 ------------------------------
  /** 标题区。同名 `#title` slot 优先。 */
  title?: string;
  /** OK 按钮文案（默认取 locale 的 `okText`）。同名 `#okText` slot 优先。 */
  okText?: string;
  /** 取消按钮文案（默认取 locale 的 `cancelText`）。同名 `#cancelText` slot 优先。 */
  cancelText?: string;
  /** OK 按钮类型。默认 `'primary'`。 */
  okType?: ModalOkType;
  /** OK 按钮 loading。 */
  confirmLoading?: boolean;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  /** 内容区骨架态（此时 footer 强制不渲染）。 */
  loading?: boolean;
  /** 垂直居中。 */
  centered?: boolean;
  /** Close button and its current native content/configuration. */
  closable?: boolean | ModalClosableConfig | null;
  /** 遮罩（对象形态见 `MaskType`）。 */
  mask?: MaskType;
  /** 关闭后是否卸载内容。 */
  destroyOnHidden?: boolean;
  /** 焦点行为。 */
  focusable?: FocusableConfig;

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
  OkBtn: typeof NormalOkBtn | typeof ConfirmOkBtn;
  CancelBtn: typeof NormalCancelBtn | typeof ConfirmCancelBtn;
}

/**
 * 按钮的 props。
 *
 * ⚠️ 本仓不引同包 `Button` 的 `ButtonProps`（会构成同包循环引用），用结构化描述；
 *    实际使用时会透传给 `Button`。
 */
export interface ModalButtonProps extends Record<string, unknown> {
  type?: ModalOkType;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  ghost?: boolean;
  onClick?: (e: MouseEvent) => void;
  /** Button root class —— Vue 原生 attrs。 */
  class?: ClassValue;
  /** Button root style —— Vue 原生 attrs。 */
  style?: CSSProperties;
  /** ⚠️ React 根别名不移植：用 `class`。声明 `never` 让旧写法在类型层被拒绝。 */
  className?: never;
  /** ⚠️ React 根别名不移植：用 `class`。 */
  rootClassName?: never;
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
export interface ModalFuncProps extends Omit<ModalProps, 'width' | 'title' | 'open'> {
  width?: string | number;
  /**
   * 标题区（命令式上下文允许 `VNodeChild`——程序化里 `h()` 即 React render fn 的等价物）。
   */
  title?: VNodeChild;
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
  onOk?: ModalAction;
  onCancel?: ModalAction;
  afterClose?: () => void;
  afterOpenChange?: (open: boolean) => void;
  modalRender?: (node: VNodeChild) => VNodeChild;
  footer?: VNodeChild | ((originNode: VNodeChild, extra: ModalFooterExtra) => VNodeChild);
}

export type ModalClose = (...args: unknown[]) => void;
export type ModalAction = (close: ModalClose) => unknown;

/**
 * 命令式实例（`Modal.confirm(...)` / `useModal()` 的返回值）。
 *
 * ⚠️ `destroy` 是**关闭**（走动效 + `afterClose` 后卸载），不是立即卸载。
 */
export interface ModalInstance {
  destroy: () => void;
  update: (config: Partial<ModalFuncProps> | ((prev: ModalFuncProps) => ModalFuncProps)) => void;
}

/** Hook commands additionally resolve to their accepted result. */
export interface ModalHookInstance extends ModalInstance, PromiseLike<boolean> {}

/**
 * `useModal()` 返回的 6 个方法。
 * ⚠️ `warning` 与 `warn` 是**同一个函数**（上游 `modalWarn`）。
 */
export interface ModalHookAPI {
  info: (props: ModalFuncProps) => ModalHookInstance;
  success: (props: ModalFuncProps) => ModalHookInstance;
  error: (props: ModalFuncProps) => ModalHookInstance;
  warning: (props: ModalFuncProps) => ModalHookInstance;
  warn: (props: ModalFuncProps) => ModalHookInstance;
  confirm: (props: ModalFuncProps) => ModalHookInstance;
}

/** `Modal.config` 的参数（**已废弃**，指向 `ConfigProvider.config`）。 */
export interface ModalGlobalConfig {
  rootPrefixCls?: string;
}

/** `_InternalPanelDoNotUseOrYouWillBeFired` 的 props。 */
export interface ModalPurePanelProps extends ModalSemanticTypeInput {
  prefixCls?: string;
  closable?: ModalProps['closable'];
  type?: ModalType;
  /** 标题区。同名 `#title` slot 优先。 */
  title?: string;
  /** confirm 形态的正文（`type` 有值时用）。同名 `#content` slot 优先。 */
  content?: string;
}
