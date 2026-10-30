import type { ComputedRef, InjectionKey } from 'vue';

// Historical reference: @rc-component/drawer 1.4.2 es/context.js.

/** Each open child owns its push registration until it closes or unmounts. */
export interface DrawerContextValue {
  pushDistance: string | number;
  push: (child: symbol) => void;
  pull: (child: symbol) => void;
}
export const drawerContextKey: InjectionKey<ComputedRef<DrawerContextValue> | null> =
  Symbol('apollo-drawer-context');
