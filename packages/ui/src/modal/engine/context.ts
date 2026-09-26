/**
 * dialog 内核的 context —— `@rc-component/dialog@1.10.0` `es/context.js` 的 Vue 版。
 *
 * | React | Vue |
 * |---|---|
 * | `RefContext = createContext({})` + `Provider value={{panel}}` | `provide` / `inject` + `InjectionKey` |
 *
 * 上游把 `panelRef`（antd 的 `panelRef` prop，用于 watermark 等）从 `DialogWrap`
 * 透给 `Panel`。本仓额外用它把**面板元素**回传给 `Dialog`（焦点归还要 `focus()` 它）。
 */
import type { InjectionKey, Ref } from 'vue';

export interface DialogRefContextValue {
  /** 面板根元素（`{p}` 那个 div，`tabIndex=-1`）。 */
  panel?: Ref<HTMLElement | null>;
}

export const dialogRefContextKey: InjectionKey<DialogRefContextValue> = Symbol(
  'apollo-dialog-ref-context',
);
