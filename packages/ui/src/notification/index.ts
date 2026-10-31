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
import { type App, createApp, defineComponent, h, shallowRef } from 'vue';
import ConfigProvider from '../config-provider';
import { globalConfig } from '../config-provider/global-config';

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
  /**
   * 根应用。⚠️ 必须留引用：销毁时要 `unmount()` —— 只重置模块变量会留下一个
   * 仍在运行的 Vue app（watch 监听 + Teleport 到 `document.body` 的 notice 不会消失）
   * （Issue #44，与 message 的 Issue #43 同判）。
   */
  app?: App<Element> | null;
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
  const mergedContainer = defaultGlobalConfig.getContainer?.() ?? document.body;
  return { ...defaultGlobalConfig, getContainer: () => mergedContainer };
}

const GlobalHolder = defineComponent({
  name: 'ANotificationGlobalHolder',
  setup() {
    const owner = notification;
    const [api, holder] = useInternalNotification(globalConfigRef);
    const sync = (): void => {
      globalConfigRef.value = getGlobalContext();
    };

    Promise.resolve().then(() => {
      if (!owner || notification !== owner) return;
      if (!owner.instance) {
        owner.instance = api;
        owner.sync = sync;
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
      const global = globalConfig();
      const Root = defineComponent({
        setup: () => () =>
          h(
            ConfigProvider,
            {
              prefixCls: global.getPrefixCls(),
              iconPrefixCls: global.getIconPrefixCls(),
              theme: global.getTheme(),
            },
            { default: () => h(GlobalHolder) },
          ),
      });
      const app = createApp(Root);
      app.mount(container);
      newNotification.app = app;
    });

    return;
  }

  if (!notification.instance) return;

  const instance = notification.instance;
  const tasks = taskQueue;
  taskQueue = [];
  for (const task of tasks) {
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

const staticMethods = {
  open,
  destroy,
  config: setNotificationGlobalConfig,
  useNotification,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
  _InternalListDoNotUseOrYouWillBeFired: PureList,
  success: (config: ArgsProps) => open({ ...config, type: 'success' }),
  info: (config: ArgsProps) => open({ ...config, type: 'info' }),
  warning: (config: ArgsProps) => open({ ...config, type: 'warning' }),
  error: (config: ArgsProps) => open({ ...config, type: 'error' }),
};

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
  // ⚠️ 先卸载根应用：只重置模块变量会留下一个仍在运行的 Vue app
  //    （它的 watch 还在、Teleport 出去的 notice 还挂在 document.body 上）。
  notification?.app?.unmount();
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
  NotificationPureListProps,
  NotificationPurePanelEmits,
  NotificationPurePanelProps,
  NotificationPurePanelSlots,
  NotificationSemanticType,
} from './interface';
