/**
 * message 的命令式 API —— antd `components/message/index.tsx` 的 Vue 版。
 *
 * 结构（逐字对齐上游）：
 * ```text
 * message.success('hi')
 *   └─ typeOpen(type, args) → wrapPromiseFn（可调用 + thenable）
 *        └─ taskQueue.push(task) → flushMessageQueue()
 *             ├─ 首次：建 holder（挂到**游离**容器上，不污染 document）
 *             │    └─ 实例就绪后回放队列
 *             └─ 已就绪：逐条 task 交给内核的 open/close/destroy
 * ```
 *
 * 必须逐字保留的判据：
 *   1. **模块级单例**（`message` / `taskQueue` / `defaultGlobalConfig`）—— 静态方法
 *      没有组件实例，状态只能挂在模块上；
 *   2. `config()` 是**合并**（`{...defaultGlobalConfig, ...config}`）并触发 `sync()`；
 *      `getContainer` 在**调用 `config()` 时求值一次**并缓存（上游 `getGlobalContext`）；
 *   3. 实例未就绪时任务**留在队列**；就绪后回放并清空；
 *   4. `skipped` 标记用于「开了立刻关」的竞态（上游 `immediately.test`）；
 *   5. `destroy(key)` 传 key 只关那一条，不传则清空。
 *
 * ⚠️ 与上游的三处平台差异（登记在 COMPATIBILITY.md）：
 *   - 用**游离的 `div`** 承载 holder（React 用 `DocumentFragment`）：两者都不进 document，
 *     观测一致 —— Vue 的 `app.mount` 需要一个真实元素；
 *   - 不实现 `holderRender`（D30：React 特有的「再包一层」）；
 *   - 不实现 `warnContext` 告警（D30 同源：本仓没有那套 context 告警基建）。
 */
import { type App, createApp, defineComponent, h, shallowRef } from 'vue';

import ConfigProvider from '../config-provider';
import { globalConfig } from '../config-provider/global-config';

import type {
  ArgsProps,
  ConfigOptions,
  MessageInstance,
  MessageType,
  NoticeType,
  TypeOpen,
} from './interface';
import PureList from './PureList';
import PurePanel from './PurePanel';
import useMessage, { useInternalMessage } from './useMessage';
import { wrapPromiseFn } from './util';

// ==============================================================================
// ==                                 Global                                   ==
// ==============================================================================

interface GlobalMessage {
  /** 游离容器（不进 document —— 与 antd 的 DocumentFragment 同效）。 */
  container: HTMLElement;
  /**
   * 根应用。⚠️ 必须留引用：销毁时要 `unmount()` —— 只重置模块变量会留下一个
   * 仍在运行的 Vue app（watch 监听 + Teleport 到 `document.body` 的 notice 不会消失）
   * （Issue #43）。
   */
  app?: App<Element> | null;
  instance?: MessageInstance | null;
  sync?: () => void;
}

interface OpenTask {
  type: 'open';
  config: ArgsProps;
  resolve: () => void;
  setCloseFn: (closeFn: () => void) => void;
  skipped?: boolean;
}

interface TypeTask {
  type: NoticeType;
  args: Parameters<TypeOpen>;
  resolve: () => void;
  setCloseFn: (closeFn: () => void) => void;
  skipped?: boolean;
}

type Task = OpenTask | TypeTask | { type: 'destroy'; key?: string | number; skipped?: boolean };

let message: GlobalMessage | null = null;

/** 任务执行器。React 侧是 `act`（测试里可换）；Vue 侧只是一个可替换的同步执行器。 */
let act: (callback: () => void) => void = (callback) => callback();

let taskQueue: Task[] = [];

let defaultGlobalConfig: ConfigOptions = {};

/** holder 的配置（`config()` 后由 `sync()` 刷新 ⇒ 组件重渲染）。 */
const globalConfigRef = shallowRef<ConfigOptions>({});

function getGlobalContext(): ConfigOptions {
  const mergedContainer = defaultGlobalConfig.getContainer?.() ?? document.body;
  return { ...defaultGlobalConfig, getContainer: () => mergedContainer };
}

/** 全局 holder 的根组件：把内核实例交给模块级单例。 */
const GlobalHolder = defineComponent({
  name: 'AMessageGlobalHolder',
  setup() {
    const owner = message;
    const [api, holder] = useInternalMessage(globalConfigRef);
    const sync = (): void => {
      globalConfigRef.value = getGlobalContext();
    };

    // ⚠️ 等 mount 完成后再交付实例（对齐上游的 `Promise.resolve().then(...)`）：
    //    此刻 holder 内部的 ref 才被赋上，`open` 才真的能落进内核。
    Promise.resolve().then(() => {
      if (!owner || message !== owner) return;
      if (!owner.instance) {
        owner.instance = api;
        owner.sync = sync;
        flushMessageQueue();
      }
    });

    return () => holder();
  },
});

function flushMessageQueue(): void {
  if (!message) {
    // 首次：建 holder（游离容器 + 独立 app 实例）
    const container = document.createElement('div');
    const newMessage: GlobalMessage = { container };
    message = newMessage;

    // ⚠️ 初始配置必须在这里落一次：`config()` 在 holder 建起来**之前**调用时
    //    只能改 `defaultGlobalConfig`（`message?.sync?.()` 是空操作），
    //    所以 holder 的初始配置要主动取一次 `getGlobalContext()`
    //    （上游 `GlobalHolderWrapper` 的 `useState(getGlobalContext)` 同判）。
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
      newMessage.app = app;
    });

    return;
  }

  // 实例还没就绪：任务留在队列里
  if (!message.instance) return;

  const instance = message.instance;
  const tasks = taskQueue;
  taskQueue = [];
  for (const task of tasks) {
    // `skipped`：用户在实例就绪前就取消了这条
    if (task.skipped) continue;

    switch (task.type) {
      case 'open': {
        act(() => {
          const closeFn = instance.open({ ...defaultGlobalConfig, ...task.config });
          closeFn?.then(task.resolve);
          task.setCloseFn(closeFn);
        });
        break;
      }

      case 'destroy':
        act(() => {
          instance.destroy(task.key);
        });
        break;

      default: {
        act(() => {
          const closeFn = instance[task.type](...task.args);
          closeFn?.then(task.resolve);
          task.setCloseFn(closeFn);
        });
      }
    }
  }
}

// ==============================================================================
// ==                                  Export                                  ==
// ==============================================================================

function setMessageGlobalConfig(config: ConfigOptions): void {
  defaultGlobalConfig = { ...defaultGlobalConfig, ...config };

  act(() => {
    message?.sync?.();
  });
}

function open(config: ArgsProps): MessageType {
  const result = wrapPromiseFn((resolve) => {
    let closeFn: (() => void) | undefined;

    const task: OpenTask = {
      type: 'open',
      config,
      resolve,
      setCloseFn: (fn) => {
        closeFn = fn;
      },
    };
    taskQueue.push(task);

    return () => {
      if (closeFn) {
        act(() => {
          closeFn?.();
        });
      } else {
        task.skipped = true;
        task.resolve();
      }
    };
  });

  flushMessageQueue();

  return result;
}

function typeOpen(type: NoticeType, args: Parameters<TypeOpen>): MessageType {
  const result = wrapPromiseFn((resolve) => {
    let closeFn: (() => void) | undefined;

    const task: TypeTask = {
      type,
      args,
      resolve,
      setCloseFn: (fn) => {
        closeFn = fn;
      },
    };

    taskQueue.push(task);

    return () => {
      if (closeFn) {
        act(() => {
          closeFn?.();
        });
      } else {
        task.skipped = true;
        task.resolve();
      }
    };
  });

  flushMessageQueue();

  return result;
}

const destroy = (key?: string | number): void => {
  taskQueue.push({ type: 'destroy', key });
  flushMessageQueue();
};

const staticMethods = {
  open,
  destroy,
  config: setMessageGlobalConfig,
  useMessage,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
  _InternalListDoNotUseOrYouWillBeFired: PureList,
  info: (...args: Parameters<TypeOpen>) => typeOpen('info', args),
  success: (...args: Parameters<TypeOpen>) => typeOpen('success', args),
  warning: (...args: Parameters<TypeOpen>) => typeOpen('warning', args),
  error: (...args: Parameters<TypeOpen>) => typeOpen('error', args),
  loading: (...args: Parameters<TypeOpen>) => typeOpen('loading', args),
};

// ==============================================================================
// ==                                   Test                                   ==
// ==============================================================================

/**
 * 测试辅助：换掉任务执行器（上游的 `actWrapper`）。
 * ⚠️ 只给测试用。
 */
export function actWrapper(wrapper: (fn: () => void) => void): void {
  act = wrapper;
}

/**
 * 测试辅助：销毁全局 holder 与队列（上游的 `actDestroy`）。
 *
 * ⚠️ 只给测试用 —— 全局 holder 是模块级单例，用例之间必须复位，
 *    否则上一条用例的实例会被下一条复用。
 */
export function actDestroy(): void {
  // ⚠️ 先卸载根应用：只重置模块变量会留下一个仍在运行的 Vue app
  //    （它的 watch 还在、Teleport 出去的 notice 还挂在 document.body 上）。
  for (const task of taskQueue) if (task.type !== 'destroy') task.resolve();
  message?.app?.unmount();
  message = null;
  taskQueue = [];
  defaultGlobalConfig = {};
  globalConfigRef.value = {};
}

export default staticMethods;

export type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageInstance,
  MessagePureListProps,
  MessagePurePanelEmits,
  MessagePurePanelProps,
  MessagePurePanelSlots,
  MessageSemanticType,
  MessageType,
  NoticeType,
  TypeOpen,
} from './interface';
