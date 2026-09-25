/**
 * App 的 Context 叶子模块（registry 备注的消环产物）。
 *
 * antd 中 App ↔ message/notification/modal 互相引用（App 提供三者的
 * HookAPI context；三者的 useMessage 等又引用 App 的样式/类型）。本模块
 * **只含类型与 InjectionKey**，不含任何组件导入 ⇒ 可被三方安全依赖。
 *
 * v1：message/notification/modal 未落地，context 的默认值是**空 API 对象**
 * （antd 同款缺省 —— useApp() 无 Provider 时返回 `{}`，调用即 dev 警告）。
 */

import { type InjectionKey, inject } from 'vue';

/** antd `AppConfig`（message/notification 的配置面；v1 结构占位）。 */
export interface AppConfig {
  message?: Record<string, unknown>;
  notification?: Record<string, unknown>;
}

/** antd `useAppProps`（三个 HookAPI；v1 为结构占位 —— 方法级契约随组件落地回填）。 */
export interface UseAppProps {
  // biome-ignore lint/suspicious/noExplicitAny: antd 缺省即空对象（调用时 dev 警告）—— 方法级类型随 message/modal/notification 落地收窄
  message: Record<string, (...args: never[]) => unknown> & Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: 同上
  notification: Record<string, (...args: never[]) => unknown> & Record<string, any>;
  // biome-ignore lint/suspicious/noExplicitAny: 同上
  modal: Record<string, (...args: never[]) => unknown> & Record<string, any>;
}

/** rc/antd 的 AppContext（HookAPI 三件套）。 */
export const appContextKey: InjectionKey<UseAppProps> = Symbol('appContext');

/** antd 的 AppConfigContext（配置沿树下沉，App 嵌套时合并）。 */
export const appConfigContextKey: InjectionKey<AppConfig> = Symbol('appConfigContext');

const EMPTY_DEFAULT = {
  message: {},
  notification: {},
  modal: {},
} as UseAppProps;

/** antd `App.useApp()`（useApp）：无 Provider 时返回空 API（调用即 dev 警告）。 */
export function useApp(): UseAppProps {
  return inject(appContextKey, EMPTY_DEFAULT);
}

/** 读配置 context（App 嵌套合并用）。 */
export function injectAppConfig(): AppConfig {
  return inject(appConfigContextKey, {});
}
