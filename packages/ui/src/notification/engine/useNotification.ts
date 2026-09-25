/**
 * `useNotification` —— rc `hooks/useNotification.js` 的 Vue 版。
 *
 * 返回 `[api, holder]`：`api` 是 `{ open, close, destroy }`，`holder` 是**要渲染进
 * 组件树**的容器 vnode（antd 的 message/notification 都是把它挂到自己的 holder 上）。
 *
 * 必须逐字保留的判据：
 *   1. **内部任务队列**：容器实例就绪前调用的 `open/close/destroy` 先入队，
 *      就绪后按序回放并清空（React 18 的「ref 回调里立刻调会抛」对应到 Vue 是
 *      「首次渲染前 ref 为空」）；
 *   2. `shareConfig` 只含 4 个键（`placement` / `closable` / `duration` / `showProgress`），
 *      且**逐键 merge、`undefined` 不覆盖**（`mergeConfig` 的判据）；
 *   3. `key` 为空 ⇒ 自动生成 `rc-notification-${n}`（antd 的 message 会先生成自己的 key，
 *      所以这条基本只在直接用内核时触发）；
 *   4. `getContainer` **每次渲染都重新求值**（rc 的 effect 无依赖数组）——
 *      容器可能在运行期被换掉（`config.test` 有对应用例）。
 */
import { h, nextTick, onMounted, ref, type VNode, watch } from 'vue';

import type {
  NoticeListConfig,
  NotificationAPI,
  NotificationConfig,
  NotificationsProps,
} from '../interface';
import Notifications from './Notifications';

const defaultGetContainer = (): HTMLElement => document.body;

type Task =
  | { type: 'open'; config: NoticeListConfig }
  | { type: 'close'; key: string | number }
  | { type: 'destroy' };

let uniqueKey = 0;

/** rc 的 `mergeConfig`：逐键覆盖，`undefined` 不覆盖。 */
function mergeConfig(
  ...objList: Array<Record<string, unknown> | undefined>
): Record<string, unknown> {
  const clone: Record<string, unknown> = {};
  for (const obj of objList) {
    if (!obj) continue;
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) clone[key] = obj[key];
    }
  }
  return clone;
}

export interface UseNotificationResult {
  api: NotificationAPI;
  /**
   * 渲染进组件树的容器。
   *
   * ⚠️ 是**工厂函数**而不是现成 vnode：同一个 vnode 对象被多次 render 复用会让
   * Vue 的 patch 拿到陈旧引用（rc 返回 element 是 React 的写法，Vue 侧用工厂更稳）。
   */
  holder: () => VNode;
}

export function useNotification(rootConfig: NotificationConfig = {}): UseNotificationResult {
  const {
    getContainer = defaultGetContainer,
    motion,
    prefixCls,
    placement,
    closable,
    duration,
    showProgress,
    pauseOnHover,
    classNames,
    styles,
    components,
    maxCount,
    className,
    style,
    onAllRemoved,
    stack,
    renderNotifications,
  } = rootConfig;

  const shareConfig = { placement, closable, duration, showProgress };

  const container = ref<HTMLElement | ShadowRoot | null>(null);
  const notificationsRef = ref<{
    open: (c: Partial<NoticeListConfig>) => void;
    close: (k: string | number) => void;
    destroy: () => void;
  } | null>(null);
  const taskQueue = ref<Task[]>([]);

  const holder = (): VNode =>
    h(Notifications, {
      container: container.value,
      ref: notificationsRef,
      prefixCls,
      motion,
      maxCount,
      pauseOnHover,
      classNames,
      styles,
      components,
      className,
      style,
      onAllRemoved,
      stack,
      renderNotifications,
    } as NotificationsProps as never);

  const open = (config: Partial<NoticeListConfig>): void => {
    const mergedConfig = mergeConfig(
      shareConfig,
      config as Record<string, unknown>,
    ) as Partial<NoticeListConfig>;
    if (mergedConfig.key === null || mergedConfig.key === undefined) {
      mergedConfig.key = `rc-notification-${uniqueKey}`;
      uniqueKey += 1;
    }
    taskQueue.value = [
      ...taskQueue.value,
      { type: 'open', config: mergedConfig as NoticeListConfig },
    ];
  };

  const api: NotificationAPI = {
    open,
    close: (key: string | number) => {
      taskQueue.value = [...taskQueue.value, { type: 'close', key }];
    },
    destroy: () => {
      taskQueue.value = [...taskQueue.value, { type: 'destroy' }];
    },
  };

  /** 容器解析：每次渲染都重算（见文件头 4）。 */
  const resolveContainer = (): void => {
    container.value = getContainer();
  };

  const flush = (): void => {
    const instance = notificationsRef.value;
    if (!instance || !taskQueue.value.length) return;
    for (const task of taskQueue.value) {
      if (task.type === 'open') instance.open(task.config);
      else if (task.type === 'close') instance.close(task.key);
      else instance.destroy();
    }
    taskQueue.value = [];
  };

  onMounted(() => {
    resolveContainer();
    nextTick(flush);
  });
  watch(taskQueue, () => nextTick(flush), { deep: false, flush: 'post' });
  watch(container, () => nextTick(flush), { flush: 'post' });

  return { api, holder };
}

export default useNotification;
