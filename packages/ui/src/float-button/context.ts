/**
 * FloatButton 的 Group 上下文（antd `context.ts` 逐字语义）。
 *
 * Group 把 item 级/trigger 级的语义 classNames/styles 与 shape/individual
 * 经此注入子 FloatButton。
 */

import {
  type ComputedRef,
  computed,
  defineComponent,
  type InjectionKey,
  inject,
  type PropType,
  provide,
  type SlotsType,
} from 'vue';
import type { FloatButtonSemanticStyles, FloatButtonShape } from './interface';

export interface FloatButtonGroupContextValue {
  shape: FloatButtonShape;
  /** 当前按钮们是否互相独立（circle ⇒ true；square 走 Space.Compact）。 */
  individual: boolean;
  classNames?: Partial<{
    root?: string;
    icon?: string;
    content?: string;
  }>;
  styles?: FloatButtonSemanticStyles;
}

export type GroupContextRef = ComputedRef<FloatButtonGroupContextValue | null>;

export const groupContextKey: InjectionKey<GroupContextRef> = Symbol('floatButtonGroup');

export function provideFloatButtonGroup(value: GroupContextRef): void {
  provide(groupContextKey, value);
}

export function useFloatButtonGroup(): GroupContextRef | null {
  return inject(groupContextKey, null);
}

/** Renderless boundary keeps trigger semantics independent from list items. */
export const FloatButtonGroupProvider = defineComponent({
  name: 'AFloatButtonGroupProvider',
  props: { value: { type: Object as PropType<FloatButtonGroupContextValue>, required: true } },
  slots: Object as SlotsType<{ default?: () => import('vue').VNodeChild }>,
  setup(props, { slots }) {
    provideFloatButtonGroup(computed(() => props.value));
    return () => slots.default?.();
  },
});
