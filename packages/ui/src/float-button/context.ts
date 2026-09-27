/**
 * FloatButton 的 Group 上下文（antd `context.ts` 逐字语义）。
 *
 * Group 把 item 级/trigger 级的语义 classNames/styles 与 shape/individual
 * 经此注入子 FloatButton。
 */

import { type ComputedRef, type InjectionKey, inject, provide } from 'vue';
import type { AutoCompleteSemanticStyles } from '../auto-complete/interface';
import type { FloatButtonShape } from './interface';

export interface FloatButtonGroupContextValue {
  shape: FloatButtonShape;
  /** 当前按钮们是否互相独立（circle ⇒ true；square 走 Space.Compact）。 */
  individual: boolean;
  classNames?: Partial<{
    root?: string;
    icon?: string;
    content?: string;
  }>;
  styles?: AutoCompleteSemanticStyles;
}

export type GroupContextRef = ComputedRef<FloatButtonGroupContextValue | null>;

export const groupContextKey: InjectionKey<GroupContextRef> = Symbol('floatButtonGroup');

export function provideFloatButtonGroup(value: GroupContextRef): void {
  provide(groupContextKey, value);
}

export function useFloatButtonGroup(): FloatButtonGroupContextValue | null {
  return inject(groupContextKey, null)?.value ?? null;
}
