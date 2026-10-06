/**
 * Input 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 `components/input/{Input,TextArea,Password,Group}.tsx`
 * 的类型段（**逐字段对齐**，含 Omit 清单）+ `@rc-component/input@1.3.1` 的底层面。
 *
 * 差异（`React.*` → Vue，规则 C16 / C18 / D21 / D42）：
 *   - `React.ReactNode` → `VNodeChild`（组件对象按 D42 归一化）
 *   - `React.CSSProperties` → Vue 的 `CSSProperties`
 *   - 事件走 attrs（PITFALLS 35）：`onChange` / `onFocus` / `onBlur` / `onPressEnter` /
 *     `onKeyDown` / `onKeyUp` / `onCompositionStart` / `onCompositionEnd` / `onClear` /
 *     `onResize` **不声明 emits**
 *   - 只声明 `update:value`（C11：v-model 与语义事件同时发出）
 */

import type { CSSProperties, VNodeChild } from 'vue';
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
  prefix?: VNodeChild;
  suffix?: VNodeChild;
  /** @deprecated 用 `Space.Compact`。 */
  addonBefore?: VNodeChild;
  /** @deprecated 用 `Space.Compact`。 */
  addonAfter?: VNodeChild;
  allowClear?: AllowClearProp;
  /** @deprecated 用 `allowClear={{ clearIcon }}`。 */
  clearIcon?: VNodeChild;
  showCount?: ShowCountProp;
  count?: InputCountProp;
  maxLength?: number;
  htmlSize?: number;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  hidden?: boolean;
  placeholder?: string;
  onChange?: (e: unknown) => void;
  onPressEnter?: (e: KeyboardEvent) => void;
  classNames?: InputSemanticClassNames | InputSemanticClassNamesFn;
  styles?: InputSemanticStyles | InputSemanticStylesFn;
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
  clearIcon?: VNodeChild;
  showCount?: ShowCountProp;
  count?: InputCountProp;
  maxLength?: number;
  rows?: number;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
  autoComplete?: string;
  hidden?: boolean;
  placeholder?: string;
  onChange?: (e: unknown) => void;
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

export interface InputPasswordProps {
  prefixCls?: string;
  inputPrefixCls?: string;
  disabled?: boolean;
  /** @deprecated 用 `variant`。 */
  bordered?: boolean;
  variant?: Variant;
  size?: SizeType;
  value?: string;
  defaultValue?: string;
  suffix?: VNodeChild;
  visibilityToggle?:
    | boolean
    | {
        visible?: boolean;
        onVisibleChange?: (visible: boolean) => void;
        tabIndex?: number;
        action?: 'click' | 'hover';
      };
  iconRender?: (visible: boolean) => VNodeChild;
  classNames?:
    | PasswordSemanticClassNames
    | ((context: InputSemanticContext) => PasswordSemanticClassNames);
  styles?: InputSemanticStyles | InputSemanticStylesFn;
}

// ============================== Group ==============================

export interface InputGroupProps {
  prefixCls?: string;
  size?: SizeType;
  compact?: boolean;
}
