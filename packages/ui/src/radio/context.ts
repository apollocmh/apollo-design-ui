/**
 * RadioGroup 的上下文（antd 的 `radio/context.js` 对应物：RadioGroupContext +
 * RadioOptionTypeContext 两个通道）。
 */

import { type InjectionKey, inject, provide } from 'vue';
import type { RadioGroupContextValue, RadioGroupOptionType } from './interface';

export const radioGroupContextKey: InjectionKey<RadioGroupContextValue> =
  Symbol('apolloRadioGroup');

/** 读取 Group 上下文（未包裹时为 undefined —— antd 同）。 */
export function useRadioGroup(): RadioGroupContextValue | undefined {
  return inject(radioGroupContextKey, undefined);
}

/** Group 侧 provide。 */
export function provideRadioGroupContext(context: RadioGroupContextValue): void {
  provide(radioGroupContextKey, context);
}

// ---------------- OptionType 通道（RadioButton 的形态切换） ----------------

export const radioOptionTypeContextKey: InjectionKey<RadioGroupOptionType> =
  Symbol('apolloRadioOptionType');

export function useRadioOptionType(): RadioGroupOptionType | undefined {
  return inject(radioOptionTypeContextKey, undefined);
}

export function provideRadioOptionTypeContext(optionType: RadioGroupOptionType): void {
  provide(radioOptionTypeContextKey, optionType);
}
