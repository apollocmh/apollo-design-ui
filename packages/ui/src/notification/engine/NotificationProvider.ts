/**
 * `NotificationProvider` —— rc `NotificationProvider.js` 的 Vue 版。
 *
 * 只做一件事：把 `classNames` 注入子树，供 `NotificationList` 读 `classNames.list`
 * （antd 的 message 用它把 `-css-var` 类挂到每个 placement 列表上 —— 见
 * `useMessage.tsx` 的 `renderNotifications`）。
 *
 * ⚠️ 注入的是 `ComputedRef`（不是裸值）：本仓的既定判据 —— `inject` 只在 setup 期
 * 解析一次，裸对象是快照，provider 侧更新不会传导（D37/D39 同判）。
 */
import {
  type ComputedRef,
  computed,
  defineComponent,
  type InjectionKey,
  inject,
  type PropType,
  provide,
} from 'vue';

import type { NotificationClassNames } from './interface';

export interface NotificationProviderContext {
  classNames?: NotificationClassNames;
}

export const notificationContextKey: InjectionKey<ComputedRef<NotificationProviderContext>> =
  Symbol('apollo-notification-context');

/** 读取通知上下文（默认空对象，与 rc 的 `createContext({})` 同判）。 */
export function useNotificationContext(): ComputedRef<NotificationProviderContext> {
  return inject(
    notificationContextKey,
    computed(() => ({}) as NotificationProviderContext),
  );
}

export default defineComponent({
  name: 'ANotificationProvider',
  props: {
    classNames: {
      type: Object as PropType<NotificationClassNames>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    provide(
      notificationContextKey,
      computed(() => ({ classNames: props.classNames })),
    );
    return () => slots.default?.();
  },
});
