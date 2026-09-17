/**
 * locale 的注入上下文。
 *
 * 契约来源：antd 6.6.4 的 `es/locale/context.js` —— `createContext(undefined)`。
 * 默认值是 `undefined`（**不是空对象**），这一点很重要：`useLocale` 靠
 * 「`fullLocale` 是不是 `undefined`」区分「没挂 Provider」与「挂了但没给这个分片」。
 */

import type { ComputedRef, InjectionKey, MaybeRefOrGetter } from 'vue';
import type { Locale } from './types';

/**
 * context 的值：`Locale` 加上一个 `exist` 标志。
 *
 * ⚠️ `exist` 是 antd 的内部约定（`index.js:28` 的 `{...locale, exist: true}`），
 *    唯一用途是让 `useLocale` 在「挂了 Provider 但没给 `locale` 字段」时
 *    回退到 `'en'`（见 `use-locale.ts`）。
 */
/**
 * ⚠️ 是 **Partial** —— `LocaleProvider` 的 `locale` prop 默认值是 `{}`，
 *    注入出去的值就是 `{exist: true}`（没有 `locale` 字段）。
 *    用完整的 `Locale` 会逼得每个只覆盖一个分片的调用方都要编造一个 `locale` 字符串。
 */
export type LocaleContextValue = Partial<Locale> & { exist?: boolean };

/**
 * 注入键。
 *
 * ⚠️ 值的形态接受 `ComputedRef` / getter / 普通对象三种 —— `LocaleProvider`
 *    提供的是 `ComputedRef`（这样 `locale` prop 变化能被追踪），但消费方直接
 *    `provide` 一个普通对象也应当工作。`useLocale` 内部用 `toValue` 归一。
 */
export type LocaleContextSource =
  | LocaleContextValue
  | ComputedRef<LocaleContextValue>
  | (() => LocaleContextValue)
  | undefined;

export const localeContextKey: InjectionKey<MaybeRefOrGetter<LocaleContextValue> | undefined> =
  Symbol('apollo-locale-context');
