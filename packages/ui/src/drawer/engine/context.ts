/**
 * drawer 内核的两个 context —— `@rc-component/drawer@1.4.2` `es/context.js` 的 Vue 版。
 *
 * | React | Vue |
 * |---|---|
 * | `React.createContext(null)` + `Provider` | `provide` / `inject` + `InjectionKey` |
 * | `RefContext`（把 `panelRef` 透给 DrawerPanel） | 同上 |
 */
import type { ComputedRef, InjectionKey, Ref } from 'vue';

/** 推挤链：子 drawer 打开时 `push()` 让父级知道「有人来了」。 */
export interface DrawerContextValue {
  /** 推挤距离（`push.distance ?? 父级 ?? 180`）。⚠️ 可以是带单位的字符串。 */
  pushDistance: string | number;
  push: () => void;
  pull: () => void;
}

/** 面板 ref 的透传（antd 用它把 `panelRef` 交给 watermark 等）。 */
export interface DrawerRefContextValue {
  panel?: Ref<HTMLElement | null> | ((el: unknown) => void);
}

/**
 * ⚠️ 值是 **ComputedRef** —— `pushDistance` 是派生的（`push.distance ?? 父级 ?? 180`），
 *    子 drawer 必须读到最新的那个值。
 */
export const drawerContextKey: InjectionKey<ComputedRef<DrawerContextValue> | null> =
  Symbol('apollo-drawer-context');

export const drawerRefContextKey: InjectionKey<DrawerRefContextValue> = Symbol(
  'apollo-drawer-ref-context',
);
