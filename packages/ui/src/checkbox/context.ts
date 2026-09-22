/**
 * CheckboxGroup 的上下文（antd 的 `GroupContext.js` 对应物）。
 */

import { type InjectionKey, inject, provide } from 'vue';
import type { CheckboxGroupContext } from './interface';

export const groupContextKey: InjectionKey<CheckboxGroupContext> = Symbol('apolloCheckboxGroup');

/** 读取 Group 上下文（未包裹时为 undefined —— antd 同）。 */
export function useCheckboxGroup(): CheckboxGroupContext | undefined {
  return inject(groupContextKey, undefined);
}

/** Group 侧 provide。 */
export function provideGroupContext(context: CheckboxGroupContext): void {
  provide(groupContextKey, context);
}
