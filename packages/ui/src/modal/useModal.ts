import { defaultLocale, useLocale } from '@apollo-design/locale';
import {
  defineComponent,
  h,
  onBeforeUnmount,
  onScopeDispose,
  type Ref,
  ref,
  type ShallowRef,
  shallowRef,
  type VNode,
} from 'vue';
import { useConfigContext } from '../config-provider/context';
import ConfirmDialog from './ConfirmDialog';
import { withConfirm, withError, withInfo, withSuccess, withWarn } from './confirm';
import destroyFns from './destroyFns';
import type { ModalFuncProps, ModalHookAPI, ModalHookInstance } from './interface';

/** The existing holder VNode renders current session data under its own Vue context. */
export default function useModal(): [ModalHookAPI, VNode] {
  let nextKey = 0;
  let disposed = false;
  const sessions = shallowRef<Array<ReturnType<typeof createSession>>>([]);

  function createSession(initial: ModalFuncProps): ModalHookInstance & {
    key: number;
    config: ShallowRef<ModalFuncProps>;
    open: Ref<boolean>;
    close: (...args: unknown[]) => void;
    finish: () => void;
    confirm: (value: boolean) => void;
    isSilent: () => boolean;
  } {
    const config = shallowRef(initial);
    const open = ref(true);
    let finished = false;
    let silent = false;
    let resolved = false;
    let resolveResult: (value: boolean) => void = () => {};
    const result = new Promise<boolean>((resolve) => {
      resolveResult = resolve;
    });
    const confirm = (value: boolean) => {
      if (resolved || finished) return;
      resolved = true;
      resolveResult(value);
    };
    const unregister = () => {
      const index = destroyFns.indexOf(destroy);
      if (index !== -1) destroyFns.splice(index, 1);
    };
    const finish = () => {
      if (finished) return;
      confirm(false);
      finished = true;
      unregister();
      sessions.value = sessions.value.filter((item) => item !== session);
      config.value.afterClose?.();
    };
    const close = (...args: unknown[]) => {
      if (finished || !open.value) return;
      open.value = false;
      const triggerCancel = args.some(
        (value) =>
          typeof value === 'object' &&
          value !== null &&
          'triggerCancel' in value &&
          value.triggerCancel === true,
      );
      if (triggerCancel) config.value.onCancel?.(close);
      // There can be no leave motion before the holder mounts.
      if (!holderMounted) finish();
    };
    function destroy() {
      confirm(false);
      close();
    }
    const session = {
      key: nextKey++,
      config,
      open,
      close,
      finish,
      confirm,
      isSilent: () => silent,
      destroy,
      update(update: Parameters<ModalHookInstance['update']>[0]) {
        if (finished || !open.value) return;
        config.value = {
          ...config.value,
          ...(typeof update === 'function' ? update(config.value) : update),
        };
      },
      // biome-ignore lint/suspicious/noThenProperty: hook commands intentionally implement PromiseLike<boolean>.
      then<TResult1 = boolean, TResult2 = never>(
        onfulfilled?: ((value: boolean) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ): PromiseLike<TResult1 | TResult2> {
        silent = true;
        return result.then(onfulfilled, onrejected);
      },
    };
    destroyFns.push(destroy);
    return session;
  }

  let holderMounted = false;
  const Holder = defineComponent({
    name: 'AModalElementsHolder',
    setup() {
      holderMounted = true;
      const config = useConfigContext();
      const [locale] = useLocale('Modal', defaultLocale.Modal);
      onBeforeUnmount(() => {
        holderMounted = false;
        for (const session of [...sessions.value]) session.finish();
      });
      return () =>
        sessions.value.map((session) =>
          h(ConfirmDialog, {
            ...session.config.value,
            key: session.key,
            prefixCls: session.config.value.prefixCls ?? config.getPrefixCls('modal'),
            rootPrefixCls: config.getPrefixCls(),
            direction: session.config.value.direction ?? config.direction,
            locale: locale.value,
            open: session.open.value,
            close: session.close,
            afterClose: session.finish,
            isSilent: session.isSilent,
            onConfirm: session.confirm,
          }),
        );
    },
  });
  onScopeDispose(() => {
    disposed = true;
    for (const session of [...sessions.value]) session.finish();
  });
  const method =
    (withType: (props: ModalFuncProps) => ModalFuncProps) =>
    (props: ModalFuncProps): ModalHookInstance => {
      const session = createSession(withType(props));
      if (disposed) session.finish();
      else sessions.value = [...sessions.value, session];
      return session;
    };
  const warning = method(withWarn);
  return [
    {
      info: method(withInfo),
      success: method(withSuccess),
      error: method(withError),
      warning,
      warn: warning,
      confirm: method(withConfirm),
    },
    h(Holder),
  ];
}
