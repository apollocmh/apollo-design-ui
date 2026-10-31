import { getConfirmLocale } from '@apollo-design/locale';
import { createApp, defineComponent, h, shallowRef } from 'vue';
import ConfigProvider from '../config-provider';
import { useConfigContext } from '../config-provider/context';
import { globalConfig } from '../config-provider/global-config';
import ConfirmDialog from './ConfirmDialog';
import destroyFns from './destroyFns';
import type { ModalFuncProps, ModalInstance, ModalType } from './interface';

let defaultRootPrefixCls = '';

export default function confirm(initial: ModalFuncProps): ModalInstance {
  const container = document.createElement('div');
  const current = shallowRef<ModalFuncProps>({ ...initial });
  const open = shallowRef(true);
  let phase: 'pending' | 'open' | 'closing' | 'closed' = 'pending';
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let unmountApp: (() => void) | undefined;

  const unregister = () => {
    const index = destroyFns.indexOf(close);
    if (index !== -1) destroyFns.splice(index, 1);
  };
  const finish = () => {
    if (phase === 'closed') return;
    phase = 'closed';
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = undefined;
    unregister();
    unmountApp?.();
    unmountApp = undefined;
    current.value.afterClose?.();
  };
  function close(...args: unknown[]) {
    if (phase === 'closing' || phase === 'closed') return;
    const wasPending = phase === 'pending';
    phase = 'closing';
    open.value = false;
    const triggerCancel = args.some(
      (value) =>
        typeof value === 'object' &&
        value !== null &&
        'triggerCancel' in value &&
        value.triggerCancel === true,
    );
    if (triggerCancel) current.value.onCancel?.(close);
    if (wasPending) finish();
  }
  const Wrapper = defineComponent({
    name: 'AModalConfirmDialogWrapper',
    setup() {
      const config = useConfigContext();
      return () => {
        const value = current.value;
        let getContainer = value.getContainer;
        if (getContainer === false) {
          getContainer = undefined;
          if (process.env.NODE_ENV !== 'production')
            console.warn(
              '[Apollo Design] `Modal`: 静态方法不支持 `getContainer: false`（它没有组件上下文）。',
            );
        }
        const rootPrefixCls = defaultRootPrefixCls || config.getPrefixCls();
        return h(ConfirmDialog, {
          ...value,
          prefixCls: value.prefixCls ?? `${rootPrefixCls}-modal`,
          rootPrefixCls,
          direction: value.direction ?? config.direction,
          locale: getConfirmLocale(),
          getContainer,
          open: open.value,
          close,
          afterClose: finish,
        });
      };
    },
  });
  timeoutId = setTimeout(() => {
    timeoutId = undefined;
    if (phase !== 'pending') return;
    phase = 'open';
    const global = globalConfig();
    const Root = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            prefixCls: global.getPrefixCls(undefined, defaultRootPrefixCls),
            iconPrefixCls: global.getIconPrefixCls(),
            theme: global.getTheme(),
          },
          { default: () => h(Wrapper) },
        ),
    });
    const app = createApp(Root);
    app.mount(container);
    unmountApp = () => app.unmount();
  });
  destroyFns.push(close);
  return {
    destroy: close,
    update(update) {
      if (phase === 'closing' || phase === 'closed') return;
      current.value = {
        ...current.value,
        ...(typeof update === 'function' ? update(current.value) : update),
      };
    },
  };
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
export function modalGlobalConfig({ rootPrefixCls }: { rootPrefixCls?: string }): void {
  if (process.env.NODE_ENV !== 'production')
    console.warn('[Apollo Design] `Modal.config` 已废弃，请用 `ConfigProvider.config`。');
  defaultRootPrefixCls = rootPrefixCls ?? '';
}
export type { ModalType };
