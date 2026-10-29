/**
 * Input 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/input/{Input,TextArea,Password,Group}.tsx`
 * 的类型段（**逐字段对齐**，含 Omit 清单）+ `@rc-component/input@1.3.1` 的底层面。
 *
 * 差异（`React.*` → Vue，规则 C16 / C18 / D21 / D42）：
 *   - `React.ReactNode` → `VNodeChild`（组件对象按 D42 归一化）
 *   - `React.CSSProperties` → Vue 的 `CSSProperties`
 *   - 语义事件通过 Vue emits 发出；change 保留真实原生事件及实际编辑节点。
 *   - DOM attrs/listeners 透传到编辑器，内容渲染使用命名/作用域插槽。
 */

import type { Component, CSSProperties, VNodeChild } from 'vue';
import type { ButtonSemanticClassNames, ButtonSemanticStyles } from '../button/interface';
import type { Variant } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { InputStatus } from '../space/statusUtils';

/** 计数策略配置（antd `count` prop）。 */
export interface InputCountProp {
  max?: number;
  strategy?: (value: string) => number;
  exceedFormatter?: (value: string, info: { max: number }) => string;
  show?: boolean | ((info: { value: string; count: number; maxLength?: number }) => unknown);
}

/** `showCount` 的对象形态（formatter 决定展示文本）。 */
export type ShowCountProp =
  | boolean
  | { formatter: (info: { value: string; count: number; maxLength?: number }) => unknown };

export type AllowClearProp = boolean | { clearIcon?: VNodeChild; disabled?: boolean };

// ============================== 语义化 ==============================

export interface InputSemanticClassNames {
  root?: string;
  prefix?: string;
  suffix?: string;
  clear?: string;
  input?: string;
  count?: string;
  affixWrapper?: string;
  wrapper?: string;
  groupWrapper?: string;
  variant?: string;
}

export interface InputSemanticStyles {
  root?: CSSProperties;
  prefix?: CSSProperties;
  suffix?: CSSProperties;
  clear?: CSSProperties;
  input?: CSSProperties;
  count?: CSSProperties;
  affixWrapper?: CSSProperties;
  wrapper?: CSSProperties;
}

export interface InputSemanticContext {
  props: InputProps;
}

export type InputSemanticClassNamesFn = (context: InputSemanticContext) => InputSemanticClassNames;
export type InputSemanticStylesFn = (context: InputSemanticContext) => InputSemanticStyles;

export interface TextAreaSemanticClassNames {
  root?: string;
  textarea?: string;
  clear?: string;
  count?: string;
  affixWrapper?: string;
  variant?: string;
}
export interface TextAreaSemanticStyles {
  root?: CSSProperties;
  textarea?: CSSProperties;
  clear?: CSSProperties;
  count?: CSSProperties;
}
export interface TextAreaSemanticContext {
  props: TextAreaProps;
}
export type TextAreaSemanticClassNamesFn = (
  context: TextAreaSemanticContext,
) => TextAreaSemanticClassNames;
export type TextAreaSemanticStylesFn = (context: TextAreaSemanticContext) => TextAreaSemanticStyles;

export interface PasswordSemanticClassNames {
  root?: string;
  prefix?: string;
  suffix?: string;
  clear?: string;
  input?: string;
  count?: string;
  icon?: string;
}

export interface PasswordSemanticContext {
  props: InputPasswordProps;
}

// ============================== Input ==============================

/** antd 5.22+ 的 focus 选项。 */
export interface InputFocusOptions {
  preventScroll?: boolean;
  cursor?: 'start' | 'end' | 'all';
}

export interface InputProps {
  prefixCls?: string;
  /** 受控值（配 `v-model:value`）。 */
  value?: string;
  defaultValue?: string;
  size?: SizeType;
  disabled?: boolean;
  readOnly?: boolean;
  /** @deprecated 用 `variant`。 */
  bordered?: boolean;
  variant?: Variant;
  status?: InputStatus;
  prefix?: VNodeChild | Component;
  suffix?: VNodeChild | Component;
  /** @deprecated 用 `Space.Compact`。 */
  addonBefore?: VNodeChild | Component;
  /** @deprecated 用 `Space.Compact`。 */
  addonAfter?: VNodeChild | Component;
  allowClear?: AllowClearProp;
  /** @deprecated 用 `allowClear={{ clearIcon }}`。 */
  clearIcon?: VNodeChild | Component;
  showCount?: ShowCountProp;
  count?: InputCountProp;
  maxLength?: number;
  htmlSize?: number;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  hidden?: boolean;
  placeholder?: string;
  onChange?: (e: Event) => void;
  onClear?: (e: MouseEvent) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
  classNames?: InputSemanticClassNames | InputSemanticClassNamesFn;
  styles?: InputSemanticStyles | InputSemanticStylesFn;
}

export interface InputSlots {
  prefix?: () => VNodeChild;
  suffix?: () => VNodeChild;
}

export interface InputPasswordSlots extends InputSlots {
  icon?: (scope: { visible: boolean }) => VNodeChild;
}

export interface OTPSlots {
  separator?: (scope: { index: number }) => VNodeChild;
}

export interface InputRef {
  focus: (option?: InputFocusOptions) => void;
  blur: () => void;
  setSelectionRange: (
    start: number,
    end: number,
    direction?: 'forward' | 'backward' | 'none',
  ) => void;
  select: () => void;
  input: HTMLInputElement | null;
  nativeElement: HTMLElement | null;
}

// ============================== TextArea ==============================

export interface TextAreaProps {
  prefixCls?: string;
  value?: string;
  defaultValue?: string;
  size?: SizeType;
  disabled?: boolean;
  readOnly?: boolean;
  /** @deprecated 用 `variant`。 */
  bordered?: boolean;
  variant?: Variant;
  status?: InputStatus;
  allowClear?: AllowClearProp;
  /** @deprecated 用 `allowClear={{ clearIcon }}`。 */
  clearIcon?: VNodeChild | Component;
  showCount?: ShowCountProp;
  count?: InputCountProp;
  maxLength?: number;
  rows?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  autoComplete?: string;
  hidden?: boolean;
  placeholder?: string;
  onChange?: (e: Event) => void;
  onClear?: (e: MouseEvent) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
  onResize?: (size: { width: number; height: number }) => void;
  classNames?: TextAreaSemanticClassNames | TextAreaSemanticClassNamesFn;
  styles?: TextAreaSemanticStyles | TextAreaSemanticStylesFn;
}

export interface TextAreaRef {
  focus: (option?: { preventScroll?: boolean }) => void;
  blur: () => void;
  resizableTextArea?: { textArea: HTMLTextAreaElement | null };
  nativeElement: HTMLElement | null;
}

// ============================== Password ==============================

/**
 * `Input.Password` 的 Props。
 *
 * ⚠️ **继承 `InputProps`**（上游 `Password.d.ts:7`：`PasswordProps extends InputProps`）。
 *
 * 此前这里是一份**独立的**接口，只抄了 10 来个字段 ⇒ `allowClear` / `readOnly` /
 * `maxLength` / `showCount` / `status` 等常见属性在类型层**不存在**。
 * 运行时它们其实能透传（Password 把 `...attrs` 交给内层 Input，Input 声明了这些 prop），
 * 于是「类型比运行时窄」—— 用户按 antd 文档写的代码会被 TS 拒绝（Issue #3.4）。
 *
 * `classNames` / `styles` 必须 `Omit` 掉再声明：Password 的语义槽比 Input 多一个
 * `icon`（少 `affixWrapper` / `wrapper` / `groupWrapper` / `variant`），
 * 直接继承会与基类冲突（属性类型不兼容）。
 */
export interface InputPasswordProps extends Omit<InputProps, 'classNames' | 'styles' | 'type'> {
  inputPrefixCls?: string;
  /**
   * 显隐触发方式（**antd 6.6.4 的顶层 API**，`Password.d.ts:8`）。默认 `'click'`。
   *
   * ⚠️ 与下面的 `visibilityToggle.action` 同时给出时**顶层优先**。
   */
  action?: 'click' | 'hover';
  /**
   * @since 5.27.0
   */
  suffix?: VNodeChild | Component;
  visibilityToggle?:
    | boolean
    | {
        visible?: boolean;
        onVisibleChange?: (visible: boolean) => void;
        tabIndex?: number;
        /**
         * ⚠️ **本仓扩展**：antd 6.6.4 的 `VisibilityToggle` 里**没有**这个字段
         * （触发方式只在上面的顶层 `action`）。保留它不破坏既有用法。
         */
        action?: 'click' | 'hover';
      };
  classNames?:
    | PasswordSemanticClassNames
    | ((context: PasswordSemanticContext) => PasswordSemanticClassNames);
  styles?: InputSemanticStyles | ((context: PasswordSemanticContext) => InputSemanticStyles);
}

// ============================== Group ==============================

export interface InputGroupProps {
  prefixCls?: string;
  size?: SizeType;
  compact?: boolean;
}

// ============================== Search ==============================

export interface InputSearchSemanticClassNames {
  root?: string;
  input?: string;
  prefix?: string;
  suffix?: string;
  clear?: string;
  count?: string;
  button?: ButtonSemanticClassNames;
}

export interface InputSearchSemanticStyles {
  root?: CSSProperties;
  input?: CSSProperties;
  prefix?: CSSProperties;
  suffix?: CSSProperties;
  clear?: CSSProperties;
  count?: CSSProperties;
  button?: ButtonSemanticStyles;
}

export interface InputSearchSemanticContext {
  props: InputSearchProps;
}

export type InputSearchSemanticClassNamesFn = (
  context: InputSearchSemanticContext,
) => InputSearchSemanticClassNames;
export type InputSearchSemanticStylesFn = (
  context: InputSearchSemanticContext,
) => InputSearchSemanticStyles;

/**
 * `Input.Search` 的 Props。
 *
 * 契约来源：antd 6.6.4 `components/input/Search.tsx` 的 `SearchProps`。
 * `extends InputProps` 保留全部输入框属性；`enterButton` 在 React 侧是
 * `ReactNode`（boolean / 字符串 / 元素），Vue 侧额外接受**组件对象**（D42 同判）。
 */
export interface InputSearchProps extends Omit<InputProps, 'classNames' | 'styles'> {
  inputPrefixCls?: string;
  enterButton?: boolean | string | number | VNodeChild | Component;
  searchIcon?: VNodeChild | Component;
  loading?: boolean;
  /** 搜索回调（antd 同名 prop；`source: 'clear'` 表示由清空触发）。 */
  onSearch?: (value: string, event?: Event, info?: { source?: 'clear' | 'input' }) => void;
  onCompositionStart?: (e: CompositionEvent) => void;
  onCompositionEnd?: (e: CompositionEvent) => void;
  classNames?: InputSearchSemanticClassNames | InputSearchSemanticClassNamesFn;
  styles?: InputSearchSemanticStyles | InputSearchSemanticStylesFn;
}

// ============================== OTP ==============================

export interface OTPSemanticClassNames {
  root?: string;
  input?: string;
  separator?: string;
}

export interface OTPSemanticStyles {
  root?: CSSProperties;
  input?: CSSProperties;
  separator?: CSSProperties;
}

export interface OTPSemanticContext {
  props: OTPProps;
}

export type OTPSemanticClassNamesFn = (context: OTPSemanticContext) => OTPSemanticClassNames;
export type OTPSemanticStylesFn = (context: OTPSemanticContext) => OTPSemanticStyles;

/**
 * `Input.OTP` 的 Props。
 *
 * 契约来源：antd 6.6.4 `components/input/OTP/index.tsx` 的 `OTPProps`。
 * `onInput` 是「每次格子变化」的数组回调；`onChange` 只在**全部填满且值变化**时触发。
 */
export interface OTPProps {
  prefixCls?: string;
  length?: number;
  variant?: Variant;
  size?: SizeType;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  formatter?: (value: string) => string;
  separator?: VNodeChild;
  disabled?: boolean;
  status?: InputStatus;
  mask?: boolean | string;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  inputMode?: string;
  onInput?: (value: string[]) => void;
  onFocus?: (e: FocusEvent) => void;
  classNames?: OTPSemanticClassNames | OTPSemanticClassNamesFn;
  styles?: OTPSemanticStyles | OTPSemanticStylesFn;
}

export interface OTPRef {
  focus: () => void;
  blur: () => void;
  nativeElement: HTMLDivElement | null;
}
