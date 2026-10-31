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
import {
  h,
  nextTick,
  onMounted,
  onScopeDispose,
  onUpdated,
  ref,
  shallowRef,
  toValue,
  type VNode,
  watch,
  watchEffect,
} from 'vue';

import type { NoticeListConfig, NotificationAPI, NotificationConfig } from './interface';
import Notifications from './Notifications';

const defaultGetContainer = (): HTMLElement => document.body;

type Task =
  | { type: 'open'; config: NoticeListConfig }
  | { type: 'close'; key: string | number }
  | { type: 'destroy' };

let uniqueKey = 0;

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

  const container = ref<HTMLElement | ShadowRoot | null>(null);
  const notificationsRef = ref<{
    open: (c: NoticeListConfig) => void;
    close: (k: string | number) => void;
    destroy: () => void;
  } | null>(null);
  const taskQueue = shallowRef<Task[]>([]);
  let disposed = false;
  onScopeDispose(() => {
    disposed = true;
    for (const task of taskQueue.value) if (task.type === 'open') task.config.onRemoved?.();
    taskQueue.value = [];
  });

  const holder = (): VNode =>
    h(Notifications, {
      container: container.value,
      ref: notificationsRef,
      prefixCls: toValue(prefixCls),
      motion,
      maxCount,
      pauseOnHover,
      classNames: toValue(classNames),
      styles: toValue(styles),
      components,
      className,
      style,
      onAllRemoved,
      stack,
      renderNotifications,
    });

  const open = (config: Partial<NoticeListConfig>): void => {
    const key = config.key ?? `rc-notification-${uniqueKey++}`;
    const mergedConfig: NoticeListConfig = {
      ...config,
      key,
      placement: config.placement ?? placement,
      closable: config.closable !== undefined ? config.closable : toValue(closable),
      duration: config.duration !== undefined ? config.duration : toValue(duration),
      showProgress: config.showProgress !== undefined ? config.showProgress : toValue(showProgress),
    };
    if (disposed) {
      mergedConfig.onRemoved?.();
      return;
    }
    taskQueue.value = [...taskQueue.value, { type: 'open', config: mergedConfig }];
  };

  const api: NotificationAPI = {
    open,
    close: (key: string | number) => {
      if (!disposed) taskQueue.value = [...taskQueue.value, { type: 'close', key }];
    },
    destroy: () => {
      if (!disposed) taskQueue.value = [...taskQueue.value, { type: 'destroy' }];
    },
  };

  /** 容器解析：每次渲染都重算（见文件头 4）。 */
  const resolveContainer = (): void => {
    container.value = getContainer();
  };

  const flush = (): void => {
    const instance = notificationsRef.value;
    if (!instance || !taskQueue.value.length) return;
    const tasks = taskQueue.value;
    taskQueue.value = [];
    for (const task of tasks) {
      if (task.type === 'open') instance.open(task.config);
      else if (task.type === 'close') instance.close(task.key);
      else instance.destroy();
    }
  };

  onMounted(() => {
    watchEffect(resolveContainer, { flush: 'post' });
    nextTick(flush);
  });
  onUpdated(resolveContainer);
  watch(taskQueue, () => nextTick(flush), { deep: false, flush: 'post' });
  watch(container, () => nextTick(flush), { flush: 'post' });

  return { api, holder };
}

export default useNotification;
