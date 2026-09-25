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
import { createApp, defineComponent, shallowRef } from 'vue';

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
  const { getContainer, duration, rtl, maxCount, top, stack, prefixCls } = defaultGlobalConfig;
  const mergedContainer = getContainer?.() || document.body;

  // ⚠️ 比上游多带一个 `prefixCls`：antd 的 `GlobalHolder` 在**模块作用域**直接读
  //    `defaultGlobalConfig.prefixCls`，而我们的 Holder 是子组件（拿不到模块变量）
  //    ⇒ 通过配置对象转发，语义等价。
  return { getContainer: () => mergedContainer, duration, rtl, maxCount, top, stack, prefixCls };
}

/** 全局 holder 的根组件：把内核实例交给模块级单例。 */
const GlobalHolder = defineComponent({
  name: 'AMessageGlobalHolder',
  setup() {
    const [api, holder] = useInternalMessage(globalConfigRef);
    const sync = (): void => {
      globalConfigRef.value = getGlobalContext();
    };

    // ⚠️ 等 mount 完成后再交付实例（对齐上游的 `Promise.resolve().then(...)`）：
    //    此刻 holder 内部的 ref 才被赋上，`open` 才真的能落进内核。
    Promise.resolve().then(() => {
      if (!message) return;
      if (!message.instance) {
        message.instance = api;
        message.sync = sync;
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
      createApp(GlobalHolder).mount(container);
    });

    return;
  }

  // 实例还没就绪：任务留在队列里
  if (!message.instance) return;

  const instance = message.instance;
  for (const task of taskQueue) {
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

  taskQueue = [];
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

interface BaseMethods {
  open: (config: ArgsProps) => MessageType;
  destroy: (key?: string | number) => void;
  config: typeof setMessageGlobalConfig;
  useMessage: typeof useMessage;
  /** @private Internal Component. Do not use in your production. */
  _InternalPanelDoNotUseOrYouWillBeFired: typeof PurePanel;
  /** @private Internal Component. Do not use in your production. */
  _InternalListDoNotUseOrYouWillBeFired: typeof PureList;
}

interface MessageMethods {
  info: TypeOpen;
  success: TypeOpen;
  error: TypeOpen;
  warning: TypeOpen;
  loading: TypeOpen;
}

const methods: (keyof MessageMethods)[] = ['success', 'info', 'warning', 'error', 'loading'];

const baseStaticMethods: BaseMethods = {
  open,
  destroy,
  config: setMessageGlobalConfig,
  useMessage,
  _InternalPanelDoNotUseOrYouWillBeFired: PurePanel,
  _InternalListDoNotUseOrYouWillBeFired: PureList,
};

const staticMethods = baseStaticMethods as MessageMethods & BaseMethods;

for (const type of methods) {
  staticMethods[type] = (...args: Parameters<TypeOpen>) => typeOpen(type, args);
}

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
  MessageSemanticType,
  MessageType,
  NoticeType,
  TypeOpen,
} from './interface';
