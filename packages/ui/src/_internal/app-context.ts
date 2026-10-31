/**
 * App 的 Context 叶子模块（registry 备注的消环产物）。
 *
 * antd 中 App ↔ message/notification/modal 互相引用（App 提供三者的
 * HookAPI context；三者的 useMessage 等又引用 App 的样式/类型）。本模块
 * **只含类型与 InjectionKey**，不含任何组件导入 ⇒ 可被三方安全依赖。
 *
 * 服务类型来自实际 hook；没有 App provider 时明确报错，不伪造可用 API。
 */

import { hasInjectionContext, type InjectionKey, inject } from 'vue';
import type { ConfigOptions, MessageInstance } from '../message/interface';
import type { ModalHookAPI } from '../modal/interface';
import type { NotificationConfig, NotificationInstance } from '../notification/interface';

/** App forwards the existing hook configuration without a separate schema. */
export interface AppConfig {
  message?: ConfigOptions;
  notification?: NotificationConfig;
}

/** Services owned by the closest mounted App instance. */
export interface UseAppProps {
  message: MessageInstance;
  notification: NotificationInstance;
  modal: ModalHookAPI;
}

/** rc/antd 的 AppContext（HookAPI 三件套）。 */
export const appContextKey: InjectionKey<UseAppProps> = Symbol('appContext');

/** antd 的 AppConfigContext（配置沿树下沉，App 嵌套时合并）。 */
export const appConfigContextKey: InjectionKey<AppConfig> = Symbol('appConfigContext');

/** Read services in a descendant's setup or another active Vue injection context. */
export function useApp(): UseAppProps {
  const api = hasInjectionContext() ? inject(appContextKey, undefined) : undefined;
  if (!api) throw new Error('[Apollo App] useApp() requires an App provider.');
  return api;
}

/**
 * 读配置 context（App 嵌套合并用）。
 *
 * ⚠️ 注入的是**引用恒定的 reactive 对象**（Issue #41）—— App 一侧用 `watchEffect`
 *    打补丁更新它的内容，所以这里返回的对象可以直接在 `computed` / 渲染里读，
 *    配置更新能传导下来。
 */
export function injectAppConfig(): AppConfig {
  return inject(appConfigContextKey, {});
}
