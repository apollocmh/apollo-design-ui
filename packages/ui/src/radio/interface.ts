/**
 * Radio 的类型定义（G2 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/radio/interface.d.ts`（源码仓
 * `components/radio/interface.ts`，93 行）。**逐字段对齐**。
 *
 * 差异（`React.*` → Vue，规则 C16 / C18）：
 *   - `React.CSSProperties` → Vue 的 `CSSProperties`
 *   - `React.ReactNode` → `VNodeChild`
 *   - `children` 是 React prop，在 Vue 侧映射为 `default` 插槽（规则 C19）
 *
 * ── 两处「复用而非另起一套」（antd 同判） ────────────────────────────────────
 *
 * 1. `RadioRef`：antd 直接 `export type { CheckboxRef as RadioRef }`（rc-checkbox 的
 *    ref 形状），`RadioChangeEvent` 的 target 也是 checkbox 侧结构（`target={...props,
 *    checked}`）。⇒ 本仓同样复用 `../checkbox/interface` 的两个类型，不复制第二份
 *    —— 复制会产生「两份定义漂移」的隐患。
 * 2. `options` 的元素类型：antd 的 `RadioGroupProps['options']` 就是
 *    `(CheckboxOptionType<T> | string | number)[]`（直接复用 checkbox 的）。
 *
 * ⚠️ 命名陷阱：antd 的 `RadioGroupOptionType` 指的是 **`optionType` prop**
 * （`'default' | 'button'`），**不是** options 数组的元素类型。元素类型叫
 * `CheckboxOptionType`。两者不可混用（本仓曾用 `RadioGroupOptionType_` 占位）。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import type { CheckboxChangeEvent, CheckboxOptionType, CheckboxRef } from '../checkbox/interface';

/** antd：`export type { CheckboxRef as RadioRef } from '@rc-component/checkbox'`。 */
export type RadioRef = CheckboxRef;

/** antd 的 `RadioChangeEvent` 与 checkbox 侧结构一致（`target = {...props, checked}`）。 */
export type RadioChangeEvent = CheckboxChangeEvent;

export type RadioGroupButtonStyle = 'outline' | 'solid';
export type RadioGroupOptionType = 'default' | 'button';

/** antd 的 `Orientation`（`_util/hooks`）—— RadioGroup 的 `orientation` prop。 */
export type RadioOrientation = 'horizontal' | 'vertical';

/** Radio 在 Group 内作为选项值时的标量类型（antd 是 `any`，本仓收窄，PITFALLS 137）。 */
export type RadioValue = string | number | boolean;

/** Group 的 options 元素类型（antd 复用 checkbox 的 `CheckboxOptionType`）。 */
export type RadioOptionItem = CheckboxOptionType<RadioValue>;

// ============================== 语义化 ==============================

/** antd 的 `RadioSemanticType['classNames']`。 */
export interface RadioSemanticClassNames {
  root?: string;
  icon?: string;
  label?: string;
}

/** antd 的 `RadioSemanticType['styles']`。 */
export interface RadioSemanticStyles {
  root?: CSSProperties;
  icon?: CSSProperties;
  label?: CSSProperties;
}

/** 语义化函数形态的入参（antd 的 `GenerateSemantic`）。 */
export interface RadioSemanticContext {
  props: RadioProps;
}

export type RadioSemanticClassNamesFn = (context: RadioSemanticContext) => RadioSemanticClassNames;
export type RadioSemanticStylesFn = (context: RadioSemanticContext) => RadioSemanticStyles;

// ============================== Radio ==============================

/**
 * antd 的 `AbstractCheckboxProps<RadioChangeEvent>`（radio 侧未重新定义，直接复用）。
 *
 * ⚠️ `value` 的语义随位置变化：
 *   - **Group 内**：与 `groupContext.value` **相等比较**（`===`，不是 `includes`）；
 *   - **Group 外**：只是原生 input 的 value。
 */
export interface AbstractRadioProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  style?: CSSProperties;
  disabled?: boolean;
  title?: string;
  onChange?: (e: RadioChangeEvent) => void;
  onClick?: (e: MouseEvent) => void;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onKeyPress?: (e: KeyboardEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  value?: RadioValue;
  tabIndex?: number;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  type?: string;
  skipGroup?: boolean;
  required?: boolean;
}

export interface RadioProps extends AbstractRadioProps {
  /**
   * 只在 `Radio.Group` 内有效。
   *
   * ⚠️ 直接传给 `Radio` 会触发 usage 告警（antd：`` `optionType` is only support in
   * Radio.Group. ``）—— 组内是经 `RadioOptionTypeContext` 生效的。
   */
  optionType?: RadioGroupOptionType;
  classNames?: RadioSemanticClassNames | RadioSemanticClassNamesFn;
  styles?: RadioSemanticStyles | RadioSemanticStylesFn;
}

// ============================== Radio.Group ==============================

export interface RadioGroupProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  options?: (RadioOptionItem | string | number)[];
  disabled?: boolean;
  style?: CSSProperties;
  name?: string;
  defaultValue?: RadioValue;
  value?: RadioValue;
  onChange?: (e: RadioChangeEvent) => void;
  size?: 'large' | 'middle' | 'small';
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  id?: string;
  optionType?: RadioGroupOptionType;
  buttonStyle?: RadioGroupButtonStyle;
  orientation?: RadioOrientation;
  /** `orientation` 的布尔糖（两者同时给时 `orientation` 胜出）。 */
  vertical?: boolean;
  block?: boolean;
  role?: string;
}

/** antd 的 `RadioGroupContextProps`（`RadioGroupContext.js` 的 value）。 */
export interface RadioGroupContextValue {
  onChange?: (e: RadioChangeEvent) => void;
  value?: RadioValue;
  disabled?: boolean;
  name?: string;
  /** @internal 由 Group 的 `optionType` 决定子 Radio 的形态。 */
  optionType?: RadioGroupOptionType;
  block?: boolean;
}

/** antd 的 `RadioOptionTypeContextProps`（RadioButton 的形态切换通道）。 */
export type RadioOptionTypeContextProps = RadioGroupOptionType;

/** 暴露给父组件的实例（antd：Group 的 ref 是 `HTMLDivElement`）。 */
export interface RadioGroupRef {
  nativeElement: HTMLDivElement | null;
}

/** options 里 `label` 的类型别名（供文档与测试引用）。 */
export type RadioOptionLabel = VNodeChild;
