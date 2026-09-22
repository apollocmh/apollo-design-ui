/**
 * Layout 的上下文（antd 的 `es/layout/context.js` 对应物）。
 *
 * - `LayoutContext`：Sider 挂载时向 Layout 注册 id（Layout 据此算 `-has-sider`）。
 * - `SiderContext`：把 `siderCollapsed` 传给子孙（Menu 用它决定 inline-collapsed）。
 *
 * ⚠️ 默认值必须是**稳定引用**（antd 的 createContext 初始值同理），否则 provide
 *    每次渲染都会变。这里用模块级常量。
 */

import { type InjectionKey, inject, provide } from 'vue';
import type { LayoutContextProps, SiderContextProps } from './interface';

const NOOP_SIDER_HOOK: LayoutContextProps = {
  siderHook: {
    addSider: () => {},
    removeSider: () => {},
  },
};

export const layoutContextKey: InjectionKey<LayoutContextProps> = Symbol('apolloLayout');

export const siderContextKey: InjectionKey<SiderContextProps> = Symbol('apolloSider');

export const DEFAULT_SIDER_CONTEXT: SiderContextProps = {};

/** 读取 Layout 上下文（未包裹时返回 no-op hook —— 与 antd 的默认值一致）。 */
export function useLayoutContext(): LayoutContextProps {
  return inject(layoutContextKey, NOOP_SIDER_HOOK);
}

/** Layout 侧 provide。 */
export function provideLayoutContext(context: LayoutContextProps): void {
  provide(layoutContextKey, context);
}

/** 读取 Sider 上下文（`siderCollapsed`）。 */
export function useSiderContext(): SiderContextProps {
  return inject(siderContextKey, DEFAULT_SIDER_CONTEXT);
}

/** Sider 侧 provide。 */
export function provideSiderContext(context: SiderContextProps): void {
  provide(siderContextKey, context);
}
