/** Vue Switch public contracts. State change and native click have distinct payloads. */

import type { CSSProperties, VNodeChild } from 'vue';
import type { ComponentStyleConfig } from '../config-provider/context';

/**
 * antd：`Exclude<SizeType, 'large'> | 'default'`。
 *
 * ⚠️ `'default'` **已废弃**（antd 的告警提示改用 `'medium'`），但仍在类型里 —— 保留
 * 并输出 deprecation 告警（规则 R4「枚举值与 antd 一致」，`COMPONENT-RULES.md` §4）。
 */
export type SwitchSize = 'small' | 'medium' | 'middle' | 'default';

/** 触发变更的事件（鼠标或键盘）。 */
export type SwitchEvent = MouseEvent | KeyboardEvent;

/**
 * ⚠️ 与 Radio / Checkbox 的**事件形状不同**：这是 `(checked, event)` 两个参数，
 * 不是 `{ target: {...}, nativeEvent }` 的事件对象。
 */
export type SwitchChangeEventHandler = (checked: boolean, event: SwitchEvent) => void;

/** Native button click, including browser-generated keyboard activation. */
export type SwitchClickEventHandler = (event: MouseEvent) => void;

// ============================== 语义化 ==============================

/** antd 的 `SwitchSemanticType['classNames']`。 */
export interface SwitchSemanticClassNames {
  root?: string;
  content?: string;
  indicator?: string;
}

/** antd 的 `SwitchSemanticType['styles']`。 */
export interface SwitchSemanticStyles {
  root?: CSSProperties;
  content?: CSSProperties;
  indicator?: CSSProperties;
}

/** 语义化函数形态的入参（antd 的 `GenerateSemantic`）。 */
export interface SwitchSemanticContext {
  props: SwitchProps;
}

export type SwitchSemanticClassNamesFn = (
  context: SwitchSemanticContext,
) => SwitchSemanticClassNames;
export type SwitchSemanticStylesFn = (context: SwitchSemanticContext) => SwitchSemanticStyles;

// ============================== Switch ==============================

export interface SwitchProps {
  prefixCls?: string;
  size?: SwitchSize;
  /** 指定当前是否选中（受控）。 */
  checked?: boolean;
  /** 初始是否选中（非受控）。 */
  defaultChecked?: boolean;
  /** `checked` 的别名（antd `@since 5.12.0`）。 */
  value?: boolean;
  /** `defaultChecked` 的别名（antd `@since 5.12.0`）。 */
  defaultValue?: boolean;
  onChange?: SwitchChangeEventHandler;
  /** Native click event; checked state is delivered by change/update events. */
  onClick?: SwitchClickEventHandler;
  /** 选中时的内容。 */
  checkedChildren?: VNodeChild;
  /** 未选中时的内容。 */
  unCheckedChildren?: VNodeChild;
  /** 失效状态；⚠️ `loading` 会**强制** disabled（`||` 判据）。 */
  disabled?: boolean;
  loading?: boolean;
  autoFocus?: boolean;
  title?: string;
  tabIndex?: number;
  id?: string;
  classNames?: SwitchSemanticClassNames | SwitchSemanticClassNamesFn;
  styles?: SwitchSemanticStyles | SwitchSemanticStylesFn;
}

export interface SwitchSlots {
  checkedChildren?: () => VNodeChild;
  unCheckedChildren?: () => VNodeChild;
}

export type SwitchConfig = Pick<ComponentStyleConfig, keyof ComponentStyleConfig> &
  Pick<SwitchProps, 'classNames' | 'styles'>;

/**
 * 暴露给父组件的实例。
 *
 * ⚠️ 与 antd 的**有意差异**（PLATFORM）：antd 的 `ref` 就是 `HTMLButtonElement` 本身
 * （`forwardRef<HTMLButtonElement>`），本仓按组件库惯例暴露对象并给出 `nativeElement`
 * （与 `Button` / `Empty` 等同形）—— 迁移时 `ref.current.focus()` 要写成
 * `ref.value.focus()` 或 `ref.value.nativeElement.focus()`。
 */
export interface SwitchRef {
  nativeElement: HTMLButtonElement | null;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
}
