/**
 * menu 的上下文（rc-menu context/ 三件的 Vue 合并版）。
 *
 * - `menuContextKey`：rc MenuContext（InheritableContextProvider 的合并语义
 *   由 SubMenu 注入子级时实现）。
 * - `pathTrackerKey`：rc PathTrackerContext（keyPath 数组，SubMenu 注入）。
 * - `pathRegisterKey`：rc PathRegisterContext（非空 ⇒ measure 模式，只登记不渲染）。
 */
import {
  type ComputedRef,
  computed,
  type InjectionKey,
  inject,
  onUnmounted,
  provide,
  type Ref,
  watch,
} from 'vue';

import type { MenuMode, RenderIconType, TriggerSubMenuAction } from './interface';

export interface MenuContextData {
  /** 首次整棵菜单挂载时不播 appear，后续进入 inline 才启用。 */
  mounted: Ref<boolean>;
  prefixCls: string;
  /** ConfigProvider 的**根前缀**（无组件后缀），弹层 motion 类名用它（如 `apollo-zoom-big`）。 */
  rootPrefixCls: string;
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
  getPopupContainer?: (node: HTMLElement) => HTMLElement | ShadowRoot;
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
  /**
   * 登记子菜单弹层的「取消关闭计时器」句柄；返回注销函数。
   * `path` 是 getter —— 路径可能随 items / key 变化。
   */
  registerPopupClose?: (path: () => string[], cancel: () => void) => () => void;
  /** 进入后代弹层时，取消所有**祖先**弹层的关闭计时器（见 SubMenu 注释）。 */
  cancelAncestorPopupClose?: (keyPath: string[]) => void;
  // antd 扩展（MenuContext.tsx）
  inlineCollapsed: boolean;
  /** 折叠态 item 的 Tooltip 配置（`false` = 关闭）。 */
  tooltip?: false | Record<string, unknown>;
  direction?: 'ltr' | 'rtl';
  firstLevel: boolean;
  theme: 'light' | 'dark';
  /** overflow 折叠区的子项（hover 不开弹层）。 */
  overflowDisabled?: boolean;
  /**
   * 语义化槽位（Issue #22.6）。Menu 合并后下发，子组件按槽位取用：
   * `item` / `itemTitle` / `itemIcon` / `itemContent`（MenuItem、SubMenu 共用），
   * 以及嵌套的 `popup` / `subMenu`。
   *
   * ⚠️ 用 computed 而不是 setup 期快照 —— 否则运行期改 `classNames` 不生效。
   */
  semanticClassNames?: ComputedRef<Record<string, unknown>>;
  semanticStyles?: ComputedRef<Record<string, unknown>>;
}

export const menuContextKey: InjectionKey<MenuContextData> = Symbol('menuContext');

/** 继承上下文时保留 getter；对象展开会把运行期配置冻结成 setup 快照。 */
export function inheritMenuContext(
  context: MenuContextData,
  overrides: Partial<MenuContextData>,
): MenuContextData {
  return Object.defineProperties(
    {},
    {
      ...Object.getOwnPropertyDescriptors(context),
      ...Object.getOwnPropertyDescriptors(overrides),
    },
  ) as MenuContextData;
}
export const pathTrackerKey: InjectionKey<Ref<string[]>> = Symbol('pathTracker');
export interface PathRegister {
  registerPath: (key: string, keyPath: string[]) => void;
  unregisterPath: (key: string, keyPath: string[]) => void;
}
export const pathRegisterKey: InjectionKey<PathRegister> = Symbol('pathRegister');
/** rc PathUserContext 的 isSubPathKey（Menu 经 keyRecords 提供）。 */
/** rc OverrideContextProps（dropdown 的 OverrideProvider 对应物）。 */
export interface MenuOverrideData {
  prefixCls?: string;
  expandIcon?: unknown;
  mode?: 'horizontal' | 'vertical' | 'inline';
  selectable?: boolean;
  onClick?: () => void;
  validator?: (menuProps: { mode?: 'horizontal' | 'vertical' | 'inline' }) => void;
}
export const menuOverrideKey: InjectionKey<MenuOverrideData> = Symbol('menuOverride');
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

/**
 * measure 模式下的路径登记 —— **注册与注销必须对称**（Issue #22.8，2026-10-21 修）。
 *
 * rc 用 `useLayoutEffect(() => { registerPath(...); return () => unregisterPath(...) },
 * [connectedKeyPath])`：挂载登记、路径变化先注销旧的再登记新的、卸载注销。
 *
 * 本仓原先只有 `registerPath(...)` + `return () => null`，注释还写着「measure 子树
 * 是静态登记、无需卸载钩子」—— 这个判断只在「Menu 每次渲染整树重建」时近似成立：
 * `v-for` 里 key 变化 / 动态移除 items 时旧实例会 unmount，但 `key → keyPath` 与
 * `keyPath → key` 两张映射表都留着旧条目 ⇒ 键盘导航（按 keyPath 找邻居）与选中
 * 路径会指向已不存在的节点。
 *
 * ⚠️ 必须在 setup 同步调用（内部用 `onUnmounted`）。
 */
export function usePathRegister(
  measure: PathRegister | null,
  eventKey: string | undefined,
  keyPath: ComputedRef<string[]>,
): void {
  if (!measure) return;
  const key = eventKey ?? '';
  let registered = keyPath.value;
  measure.registerPath(key, registered);
  watch(keyPath, (next) => {
    measure.unregisterPath(key, registered);
    measure.registerPath(key, next);
    registered = next;
  });
  onUnmounted(() => {
    measure.unregisterPath(key, registered);
  });
}

// 空数组的稳定引用（模块级）
const EMPTY_PATH = computed<string[]>(() => []);

export function providePathTracker(keyPath: Ref<string[]>): void {
  provide(pathTrackerKey, keyPath);
}
