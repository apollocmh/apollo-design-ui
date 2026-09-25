/**
 * Message 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/message/interface.ts`（NoticeType /
 * MessageSemanticType / ConfigOptions / ArgsProps / JointContent / MessageType /
 * TypeOpen / MessageInstance）。按本仓 Vue 化约定重新定义（H2）：
 *   - `React.ReactNode` ⇒ `VNodeChild`；
 *   - 语义槽的**函数式形态**（`GenerateSemantic`）本仓未落地 ⇒ 只保留对象形态
 *     （D36 同判：条件类型无法被泛型函数体证明，最终要写双重断言）；
 *   - `React.Key` ⇒ `string | number`。
 */

import type { CSSProperties, VNodeChild } from 'vue';

/** 消息类型。`loading` 是「不自动关闭 + 旋转图标」的形态。 */
export type NoticeType = 'info' | 'success' | 'error' | 'warning' | 'loading';

/** 6 个语义槽（`list` / `listContent` 是**列表级**，其余是**单条**级）。 */
export interface MessageSemanticType {
  classNames?: {
    list?: string;
    listContent?: string;
    root?: string;
    wrapper?: string;
    icon?: string;
    title?: string;
  };
  styles?: {
    list?: CSSProperties;
    listContent?: CSSProperties;
    root?: CSSProperties;
    wrapper?: CSSProperties;
    icon?: CSSProperties;
    title?: CSSProperties;
  };
}

/** `message.config()` / `useMessage()` 的全局配置。 */
export interface ConfigOptions {
  /** 距顶部的偏移。number 会写成 `px`。 */
  top?: string | number;
  /** 默认时长（秒）。 */
  duration?: number;
  prefixCls?: string;
  getContainer?: () => HTMLElement;
  transitionName?: string;
  /** 最多同时显示多少条（超出保留**最后** N 条）。 */
  maxCount?: number;
  rtl?: boolean;
  /** 堆叠折叠。`true` 用默认阈值 3。 */
  stack?: boolean | { threshold?: number };
  /**
   * @descCN 悬停时是否暂停计时器
   * @descEN keep the timer running or not on hover
   */
  pauseOnHover?: boolean;
  classNames?: MessageSemanticType['classNames'];
  styles?: MessageSemanticType['styles'];
}

/** 单条消息的完整配置（`message.open`）。 */
export interface ArgsProps {
  /**
   * @descCN 消息通知的内容，接收组件或者字符串
   * @descEN The content of the message notification, receiving component or string
   */
  content: VNodeChild;
  /**
   * @descCN 消息通知持续显示的时间
   * @descEN How long the message notification remains displayed
   */
  duration?: number;
  /**
   * @descCN 消息通知的类型，可以是 'info'、'success'、'error'、'warning' 或 'loading'
   * @descEN The type of message notification, which can be 'info', 'success', 'error', 'warning' or 'loading'
   */
  type?: NoticeType;
  /**
   * @descCN 消息通知关闭时进行调用的回调函数
   * @descEN The callback function called when the message notification is closed
   */
  onClose?: () => void;
  icon?: VNodeChild;
  key?: string | number;
  style?: CSSProperties;
  className?: string;
  classNames?: MessageSemanticType['classNames'];
  styles?: MessageSemanticType['styles'];
  /**
   * @descCN 消息通知点击时的回调函数
   * @descEN Callback function when message notification is clicked
   */
  onClick?: (e: MouseEvent) => void;
  /**
   * @descCN 悬停时是否暂停计时器
   * @descEN keep the timer running or not on hover
   */
  pauseOnHover?: boolean;
}

/** `content` 与完整配置的联合（`TypeOpen` 的第一个参数）。 */
export type JointContent = VNodeChild | ArgsProps;

/**
 * `message.success(...)` 的返回值：**可调用**（调用即关闭）且 **PromiseLike<boolean>**
 * （`then` 在关闭时 resolve `true`），另有 `.promise`。
 */
export interface MessageType extends PromiseLike<boolean> {
  (): void;
  /** 底层 Promise（rc 的 `wrapPromiseFn` 额外挂上的）。 */
  promise?: Promise<boolean>;
}

/** `message.success/info/warning/error/loading` 的签名。 */
export type TypeOpen = (
  content: JointContent,
  /**
   * @descCN 消息通知持续显示的时间，也可以直接使用 onClose。
   * @descEN You can also use onClose directly to determine how long the message notification continues to be displayed.
   */
  duration?: number | (() => void),
  /**
   * @descCN 消息通知关闭时进行调用的回调函数
   * @descEN Callback function called when the message notification is closed
   */
  onClose?: () => void,
) => MessageType;

/** `useMessage()` 返回的实例（与 antd 的 `MessageInstance` 同构）。 */
export interface MessageInstance {
  info: TypeOpen;
  success: TypeOpen;
  error: TypeOpen;
  warning: TypeOpen;
  loading: TypeOpen;
  open: (args: ArgsProps) => MessageType;
  destroy: (key?: string | number) => void;
}

/** `_InternalListDoNotUseOrYouWillBeFired` 的单条数据。 */
export interface PureListItem {
  key: string | number;
  content: VNodeChild;
  type: NoticeType;
  duration?: number | false;
}
