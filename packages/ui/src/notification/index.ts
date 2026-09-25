/**
 * notification 的命令式 API —— antd `components/notification/index.tsx` 的 Vue 版。
 *
 * 与 message 同构（模块级 holder + 任务队列 + 就绪后回放），两处**关键差异**：
 *   1. **`open()` 返回 `void`** —— notification 没有 `wrapPromiseFn`，没有 thenable/可调用句柄；
 *   2. 四个类型方法（success / info / warning / error），**没有 loading**。
 *
 * ⚠️ 与上游的平台差异（与 message 同判，D96）：
 *   - 用**游离的 `div`** 承载 holder（React 用 `DocumentFragment`，两者都不进 document）；
 *   - 不实现 `holderRender` / `warnContext`（D30 同源）。
 */
import { createApp, defineComponent, shallowRef } from 'vue';
import type { ArgsProps, GlobalConfigProps, NotificationInstance } from './interface';
import PureList from './PureList';
import PurePanel from './PurePanel';
import useNotification, { useInternalNotification } from './useNotification';

// ==============================================================================
// ==                                 Global                                   ==
// ==============================================================================

interface GlobalNotification {
  /** 游离容器（不进 document —— 与 antd 的 DocumentFragment 同效）。 */
  container: HTMLElement;
  instance?: NotificationInstance | null;
  sync?: () => void;
}

type Task = { type: 'open'; config: ArgsProps } | { type: 'destroy'; key?: string | number };

let notification: GlobalNotification | null = null;

let act: (callback: () => void) => void = (callback) => callback();

let taskQueue: Task[] = [];

let defaultGlobalConfig: GlobalConfigProps = {};

/** holder 的配置（`config()` 后由 `sync()` 刷新 ⇒ 组件重渲染）。 */
const globalConfigRef = shallowRef<GlobalConfigProps>({});

function getGlobalContext(): GlobalConfigProps {
  const { getContainer, rtl, maxCount, top, bottom, showProgress, pauseOnHover, prefixCls } =
    defaultGlobalConfig;
  const mergedContainer = getContainer?.() || document.body;

  // ⚠️ 比上游多带 `prefixCls`（同 message：antd 的 GlobalHolder 在模块作用域直接读它）
  return {
    getContainer: () => mergedContainer,
    rtl,
    maxCount,
    top,
    bottom,
    showProgress,
    pauseOnHover,
    prefixCls,
  };
}

const GlobalHolder = defineComponent({
  name: 'ANotificationGlobalHolder',
  setup() {
    const [api, holder] = useInternalNotification(globalConfigRef);
    const sync = (): void => {
      globalConfigRef.value = getGlobalContext();
    };

    Promise.resolve().then(() => {
      if (!notification) return;
      if (!notification.instance) {
        notification.instance = api;
        notification.sync = sync;
        flushNotificationQueue();
      }
    });

    return () => holder();
  },
});

function flushNotificationQueue(): void {
  if (!notification) {
    const container = document.createElement('div');
    const newNotification: GlobalNotification = { container };
    notification = newNotification;

    // 初始配置必须在这里落一次（同 message：`config()` 早于 holder 建立时只能改
    // `defaultGlobalConfig`，`notification?.sync?.()` 是空操作）
    globalConfigRef.value = getGlobalContext();

    act(() => {
      createApp(GlobalHolder).mount(container);
    });

    return;
  }

  if (!notification.instance) return;

  const instance = notification.instance;
  for (const task of taskQueue) {
    switch (task.type) {
      case 'open':
        act(() => {
          instance.open({ ...defaultGlobalConfig, ...task.config });
        });
        break;

      case 'destroy':
        act(() => {
          instance.destroy(task.key);
        });
        break;
    }
  }

  taskQueue = [];
}

// ==============================================================================
// ==                                  Export                                  ==
// ==============================================================================

function setNotificationGlobalConfig(config: GlobalConfigProps): void {
  defaultGlobalConfig = { ...defaultGlobalConfig, ...config };

  act(() => {
    notification?.sync?.();
  });
}

function open(config: ArgsProps): void {
  taskQueue.push({ type: 'open', config });
  flushNotificationQueue();
}

const destroy = (key?: string | number): void => {
  taskQueue.push({ type: 'destroy', key });
  flushNotificationQueue();
};

interface BaseMethods {
  open: (config: ArgsProps) => void;
  destroy: (key?: string | number) => void;
  config: (config: GlobalConfigProps) => void;
  useNotification: typeof useNotification;
  /** @private Internal Component. Do not use in your production. */
  _InternalPanelDoNotUseOrYouWillBeFired: typeof PurePanel;
  /** @private Internal Component. Do not use in your production. */
  _InternalListDoNotUseOrYouWillBeFired: typeof PureList;
}

interface NoticeMethods {
  success: (config: ArgsProps) => void;
  info: (config: ArgsProps) => void;
  warning: (config: ArgsProps) => void;
  error: (config: ArgsProps) => void;
}

const methods: (keyof NoticeMethods)[] = ['success', 'info', 'warning', 'error'];

const baseStaticMethods: BaseMethods = {
  open,
  destroy,
  config: setNotificationGlobalConfig,
  useNotification,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
  _InternalListDoNotUseOrYouWillBeFired: PureList,
};

const staticMethods = baseStaticMethods as NoticeMethods & BaseMethods;

for (const type of methods) {
  staticMethods[type] = (config: ArgsProps) => open({ ...config, type });
}

// ==============================================================================
// ==                                   Test                                   ==
// ==============================================================================

/** 测试辅助：换掉任务执行器（上游的 `actWrapper`）。⚠️ 只给测试用。 */
export function actWrapper(wrapper: (fn: () => void) => void): void {
  act = wrapper;
}

/**
 * 测试辅助：销毁全局 holder 与队列（上游的 `actDestroy`）。
 * ⚠️ 只给测试用 —— 全局 holder 是模块级单例，用例之间必须复位。
 */
export function actDestroy(): void {
  notification = null;
  taskQueue = [];
  defaultGlobalConfig = {};
  globalConfigRef.value = {};
}

export default staticMethods;

export type {
  ArgsProps,
  GlobalConfigProps,
  IconType,
  NotificationConfig,
  NotificationInstance,
  NotificationPlacement,
  NotificationSemanticType,
} from './interface';
