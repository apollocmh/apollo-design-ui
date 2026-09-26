/**
 * 命令式路径 —— antd `components/modal/confirm.tsx`（198 行）的 Vue 版。
 *
 * ```
 * confirm(config)
 * ├─ container = document.createElement('div')          ← 游离容器（不进 document）
 * ├─ currentConfig = { ...config, close, open: true }
 * ├─ destroy(...args): triggerCancel ⇒ config.onCancel?.(()=>{}, ...)
 * │                   从 destroyFns 里**遍历移除自己** → unmount
 * ├─ scheduleRender(props): clearTimeout + setTimeout(0)  ← 异步渲染（#23623：同步渲染会挡事件）
 * ├─ close(...args): currentConfig = { open:false, afterClose: () => { config.afterClose?.(); destroy(...args) } }
 * ├─ update(cfg): 函数 ⇒ cfg(currentConfig)；对象 ⇒ 浅合并；然后 scheduleRender
 * ├─ scheduleRender(currentConfig)   ← 首次
 * └─ destroyFns.push(close)          ← ⚠️ 每次调用都要 push
 * ```
 *
 * 关键判据：
 *   1. **`destroy` 遍历移除自己**（不是 `pop`）—— `destroyAll` 已经 pop 过了；
 *   2. **`close` 不直接卸载**：先 `open: false` 走动效，动效结束的 `afterClose` 才 `destroy()`；
 *   3. `update` 走 `scheduleRender`，即**异步**；
 *   4. 静态方法 = `confirm(withXxx(props))`，`withXxx` 只补 `type`；
 *      ⚠️ `warning` 与 `warn` 是**同一个函数**。
 *
 * ⚠️ 与上游的平台差异（与 message / notification 同判，D96）：
 *   - 用**游离的 `div`** 承载 Vue 应用（React 用 `DocumentFragment`；两者都不进 document）；
 *   - 不实现 `holderRender` / `warnContext`（D30 同源）。
 */
import { getConfirmLocale } from '@apollo-design/locale';
import { isFunction } from '@apollo-design/utils';
import { createApp, defineComponent, h, type PropType, shallowRef } from 'vue';

import ConfigProvider from '../config-provider';
import { useConfigContext } from '../config-provider/context';
import { globalConfig } from '../config-provider/global-config';
import ConfirmDialog from './ConfirmDialog';
import destroyFns from './destroyFns';
import type { ModalFuncProps, ModalInstance, ModalType } from './interface';

let defaultRootPrefixCls = '';

/** 命令式实例的内部配置（比 `ModalFuncProps` 多两个必填项）。 */
type InternalConfig = ModalFuncProps & {
  open?: boolean;
  close?: (...args: unknown[]) => void;
};

function getRootPrefixCls(): string {
  return defaultRootPrefixCls;
}

/**
 * `ConfirmDialogWrapper` —— 把游离容器里的配置补上「前缀 / 图标前缀 / 方向 / locale」。
 *
 * ⚠️ 上游从 `ConfigContext` 取 `locale`；本仓的 locale 走**独立的 locale context**
 *    （`@apollo-design/locale` 的 `localeContextKey`）⇒ 这里改用
 *    `getConfirmLocale()`（模块级栈，由 `LocaleProvider` 维护），语义等价。
 */
const ConfirmDialogWrapper = defineComponent({
  name: 'AModalConfirmDialogWrapper',
  inheritAttrs: false,
  props: {
    config: { type: Object as PropType<ModalFuncProps & { open?: boolean }>, required: true },
  },
  setup(props) {
    const config = useConfigContext();

    return () => {
      const rootPrefixCls = getRootPrefixCls() || config.getPrefixCls();
      const prefixCls = props.config.prefixCls || `${rootPrefixCls}-modal`;

      let mergedGetContainer = props.config.getContainer;
      if (mergedGetContainer === false) {
        mergedGetContainer = undefined;
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn(
            '[Apollo Design] `Modal`: 静态方法不支持 `getContainer: false`（它没有组件上下文）。',
          );
        }
      }

      return h(ConfirmDialog, {
        ...(props.config as unknown as Record<string, unknown>),
        rootPrefixCls,
        prefixCls,
        direction: props.config.direction ?? config.direction,
        locale: getConfirmLocale(),
        getContainer: mergedGetContainer,
      } as never);
    };
  },
});

export default function confirm(config: ModalFuncProps): ModalInstance {
  const container = document.createElement('div');
  let currentConfig: InternalConfig = {
    ...config,
    close,
    open: true,
  };

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let unmountApp: (() => void) | undefined;
  /** 由 `ConfirmRoot` 的 setup 写入（`update` / `close` 靠它触发重渲染）。 */
  let renderState: { value: typeof currentConfig } | undefined;

  function destroy(...args: unknown[]): void {
    const triggerCancel = args.some(
      (param) => (param as { triggerCancel?: boolean } | undefined)?.triggerCancel,
    );
    if (triggerCancel) {
      (config.onCancel as ((...a: unknown[]) => void) | undefined)?.(
        (() => {}) as unknown,
        ...args.slice(1),
      );
    }

    for (let i = 0; i < destroyFns.length; i += 1) {
      const fn = destroyFns[i];
      if (fn === close) {
        destroyFns.splice(i, 1);
        break;
      }
    }

    unmountApp?.();
  }

  function scheduleRender(nextProps: typeof currentConfig): void {
    if (timeoutId) clearTimeout(timeoutId);
    /**
     * https://github.com/ant-design/ant-design/issues/23623
     *
     * 同步渲染会挡住事件（React 侧的原话）；Vue 侧同样保留这层异步，
     * 好处是 `update` / `close` 在同一 tick 内的多次调用会合并成一次渲染。
     */
    timeoutId = setTimeout(() => {
      if (renderState) {
        renderState.value = nextProps;
        return;
      }

      const global = globalConfig();
      const rootPrefixCls = global.getPrefixCls(undefined, getRootPrefixCls());
      const iconPrefixCls = global.getIconPrefixCls();
      const theme = global.getTheme();

      const ConfirmRoot = defineComponent({
        name: 'AModalConfirmRoot',
        setup() {
          const state = shallowRef(nextProps);
          renderState = state;
          return () =>
            h(
              ConfigProvider,
              {
                prefixCls: rootPrefixCls,
                iconPrefixCls,
                theme,
              } as never,
              { default: () => h(ConfirmDialogWrapper, { config: state.value } as never) },
            );
        },
      });

      const app = createApp(ConfirmRoot);
      app.mount(container);
      unmountApp = () => {
        app.unmount();
        renderState = undefined;
      };
    });
  }

  function close(...args: unknown[]): void {
    currentConfig = {
      ...currentConfig,
      open: false,
      afterClose: () => {
        if (isFunction(config.afterClose)) {
          config.afterClose();
        }
        destroy(...args);
      },
    } as typeof currentConfig;
    scheduleRender(currentConfig);
  }

  function update(
    configUpdate: Partial<ModalFuncProps> | ((prev: ModalFuncProps) => ModalFuncProps),
  ): void {
    currentConfig = isFunction(configUpdate)
      ? { ...(configUpdate as (prev: ModalFuncProps) => ModalFuncProps)(currentConfig) }
      : { ...currentConfig, ...configUpdate };
    scheduleRender(currentConfig);
  }

  scheduleRender(currentConfig);
  // ⚠️ 每次调用都要入队（`destroyAll` 会清空队列，之后新开的必须重新入队）
  destroyFns.push(close);

  return { destroy: close, update };
}

export function withWarn(props: ModalFuncProps): ModalFuncProps {
  return { ...props, type: 'warning' };
}

export function withInfo(props: ModalFuncProps): ModalFuncProps {
  return { ...props, type: 'info' };
}

export function withSuccess(props: ModalFuncProps): ModalFuncProps {
  return { ...props, type: 'success' };
}

export function withError(props: ModalFuncProps): ModalFuncProps {
  return { ...props, type: 'error' };
}

export function withConfirm(props: ModalFuncProps): ModalFuncProps {
  return { ...props, type: 'confirm' };
}

/** `Modal.config`（**已废弃**，指向 `ConfigProvider.config`）。 */
export function modalGlobalConfig({ rootPrefixCls }: { rootPrefixCls?: string }): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[Apollo Design] `Modal.config` 已废弃，请用 `ConfigProvider.config`。');
  }
  defaultRootPrefixCls = rootPrefixCls ?? '';
}

export type { ModalType };
