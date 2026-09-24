/**
 * menu 的上下文（rc-menu context/ 三件的 Vue 合并版）。
 *
 * - `menuContextKey`：rc MenuContext（InheritableContextProvider 的合并语义
 *   由 SubMenu 注入子级时实现）。
 * - `pathTrackerKey`：rc PathTrackerContext（keyPath 数组，SubMenu 注入）。
 * - `pathRegisterKey`：rc PathRegisterContext（非空 ⇒ measure 模式，只登记不渲染）。
 */
import { type ComputedRef, computed, type InjectionKey, inject, provide, type Ref } from 'vue';

import type { MenuMode, RenderIconType, TriggerSubMenuAction } from './interface';

export interface MenuContextData {
  prefixCls: string;
  /** rc IdContext 的 uuid（data-menu-id={menuId}-{key}）。 */
  menuId: string;
  mode: ComputedRef<MenuMode>;
  rootClassName?: string;
  // Disabled
  disabled: boolean;
  // Motion
  motion: unknown;
  defaultMotions: unknown;
  // Active
  activeKey: ComputedRef<string | undefined>;
  onActive: (key: string) => void;
  onInactive: (key: string) => void;
  // Selection
  selectedKeys: ComputedRef<string[]>;
  // Level
  inlineIndent: number;
  // Popup
  subMenuOpenDelay: number;
  subMenuCloseDelay: number;
  forceSubMenuRender?: boolean;
  builtinPlacements?: Record<string, unknown>;
  triggerSubMenuAction: TriggerSubMenuAction;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  // Icon
  itemIcon?: RenderIconType;
  expandIcon?: RenderIconType;
  // Events
  onItemClick: (info: unknown) => void;
  onOpenChange: (key: string, open: boolean) => void;
  // Open keys（rc MenuContext 同字段）
  openKeys: ComputedRef<string[]>;
  /** 规范节点渲染器（Menu 提供，SubMenu 递归子树用）。 */
  renderNode: (node: unknown, keyPath: string[]) => unknown;
  // antd 扩展（MenuContext.tsx）
  inlineCollapsed: boolean;
  direction?: 'ltr' | 'rtl';
  firstLevel: boolean;
  theme: 'light' | 'dark';
  /** overflow 折叠区的子项（hover 不开弹层）。 */
  overflowDisabled?: boolean;
}

export const menuContextKey: InjectionKey<MenuContextData> = Symbol('menuContext');
export const pathTrackerKey: InjectionKey<Ref<string[]>> = Symbol('pathTracker');
export interface PathRegister {
  registerPath: (key: string, keyPath: string[]) => void;
  unregisterPath: (key: string, keyPath: string[]) => void;
}
export const pathRegisterKey: InjectionKey<PathRegister> = Symbol('pathRegister');
/** rc PathUserContext 的 isSubPathKey（Menu 经 keyRecords 提供）。 */
export const isSubPathKeyKey: InjectionKey<(pathKeys: string[], eventKey: string) => boolean> =
  Symbol('isSubPathKey');

export function useMenuContext(): MenuContextData {
  const ctx = inject(menuContextKey);
  if (!ctx) {
    throw new Error('[apollo: menu] MenuContext 缺失 —— 子组件必须在 <Menu> 内使用');
  }
  return ctx;
}

export function useFullPath(eventKey: string | undefined): ComputedRef<string[]> {
  const parentKeyPath = inject(pathTrackerKey, EMPTY_PATH);
  return computed(() =>
    eventKey !== undefined ? [...parentKeyPath.value, eventKey] : parentKeyPath.value,
  );
}

/** rc `useMeasure`：非空 ⇒ measure 模式。 */
export function useMeasure(): PathRegister | null {
  return inject(pathRegisterKey, null);
}

// 空数组的稳定引用（模块级）
const EMPTY_PATH = computed<string[]>(() => []);

export function providePathTracker(keyPath: Ref<string[]>): void {
  provide(pathTrackerKey, keyPath);
}
