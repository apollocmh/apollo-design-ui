/**
 * `useModal` —— antd `components/modal/useModal/index.tsx` + `HookModal.tsx` 的 Vue 版。
 *
 * ```
 * useModal() ⇒ [fns, contextHolder]
 *   fns = { info, success, error, warning, warn, confirm }
 *   每次调用：
 *     uuid++
 *     promise = new Promise(resolve => resolvePromise = resolve)
 *     modal = <HookModal key={`modal-${uuid}`} config modalRef afterClose isSilent onConfirm />
 *     closeFunc = holder.patchElement(modal)
 *     if (closeFunc) destroyFns.push(closeFunc)      ← ⚠️ 同样入队
 *     instance = { destroy, update, then }           ← thenable
 * ```
 *
 * 关键判据：
 *   1. **`then()` 会把 `silent = true`** —— `await Modal.confirm(...)` 之后关闭时
 *      **不触发 `onCancel`**（`isSilent()` 为真）；
 *   2. `destroy` / `update` 在 `HookModal` 还没就绪时入 `actionQueue`，就绪后回放；
 *   3. `afterClose` 里调 `closeFunc()` 把 vnode 从 holder 里摘掉；
 *   4. `okText` / `cancelText` 走 `fallbackProp(config.x, locale.x)`。
 *
 * ⚠️ 两处**必须的 Vue 化改写**（不是风格选择，是平台约束）：
 *   - `contextHolder` 是**无 ref 的 vnode**，holder 实例靠 `onReady` 回调拿回来 ——
 *     Vue 的 `normalizeRef` 用 `currentRenderingInstance` 当 owner，而 `setup()` 里
 *     `currentRenderingInstance` 是 `null` ⇒ 「在 setup 里创建带 ref 的 vnode」
 *     会报 `Missing ref owner context` 且 ref **永远不生效**；
 *   - `HookModal` 的实例句柄用 **prop 传 `Ref` 对象**（`modalRef`），不用 vnode 的 `ref`
 *     —— 同一个原因：`patchElement` 是在事件回调里建 vnode，没有渲染上下文。
 */
import { defaultLocale, useLocale } from '@apollo-design/locale';
import { isFunction } from '@apollo-design/utils';
import {
  defineComponent,
  h,
  onScopeDispose,
  type PropType,
  type Ref,
  ref,
  shallowRef,
  type VNode,
  watch,
} from 'vue';

import { useConfigContext } from '../config-provider/context';
import ConfirmDialog from './ConfirmDialog';
import { withConfirm, withError, withInfo, withSuccess, withWarn } from './confirm';
import destroyFns from './destroyFns';
import type { ModalFuncProps, ModalHookAPI, ModalInstance } from './interface';
import { fallbackProp } from './util';

let uuid = 0;

/** 命令式实例的命令面（`HookModal` 写进传入的 `modalRef`）。 */
interface HookModalRef {
  destroy: (...args: unknown[]) => void;
  update: (newConfig: Partial<ModalFuncProps> | ((prev: ModalFuncProps) => ModalFuncProps)) => void;
}

/** holder 的对外能力。 */
interface HolderApi {
  patchElement: (element: VNode) => () => void;
}

// ==============================================================================
// ==                                ElementsHolder                            ==
// ==============================================================================

/** 承载所有 `HookModal` 的容器；`patchElement` 负责挂载与摘除。 */
const ElementsHolder = defineComponent({
  name: 'AModalElementsHolder',
  props: {
    onReady: { type: Function as PropType<(api: HolderApi) => void>, default: undefined },
  },
  setup(props) {
    const elements = shallowRef<VNode[]>([]);

    const patchElement = (element: VNode): (() => void) => {
      elements.value = [...elements.value, element];
      let exist = true;
      return () => {
        if (!exist) return;
        exist = false;
        elements.value = elements.value.filter((ele) => ele !== element);
      };
    };

    // 在 setup 期把能力交回调用方（`useModal` 是纯函数，拿不到组件实例）
    props.onReady?.({ patchElement });

    return () => elements.value;
  },
});

// ==============================================================================
// ==                                 HookModal                                ==
// ==============================================================================

const HookModal = defineComponent({
  name: 'AModalHookModal',
  inheritAttrs: false,
  props: {
    config: { type: Object as PropType<ModalFuncProps>, required: true },
    /** ⚠️ 用 prop 传 Ref 对象，不用 vnode 的 `ref`（见文件头）。 */
    modalRef: {
      type: Object as unknown as PropType<Ref<HookModalRef | null>>,
      default: undefined,
    },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    isSilent: { type: Function as PropType<() => boolean>, default: undefined },
    onConfirm: { type: Function as PropType<(confirmed: boolean) => void>, default: undefined },
  },
  setup(props) {
    const open = ref(true);
    const innerConfig = ref<ModalFuncProps>(props.config);
    const config = useConfigContext();

    const afterClose = (): void => {
      props.afterClose?.();
      (innerConfig.value as { afterClose?: () => void }).afterClose?.();
    };

    const close = (...args: unknown[]): void => {
      open.value = false;
      const triggerCancel = args.some(
        (param) => (param as { triggerCancel?: boolean } | undefined)?.triggerCancel,
      );
      if (triggerCancel) {
        (innerConfig.value.onCancel as ((...a: unknown[]) => void) | undefined)?.(
          (() => {}) as unknown,
          ...args.slice(1),
        );
      }
    };

    const update = (
      newConfig: Partial<ModalFuncProps> | ((prev: ModalFuncProps) => ModalFuncProps),
    ): void => {
      innerConfig.value = {
        ...innerConfig.value,
        ...(isFunction(newConfig)
          ? (newConfig as (prev: ModalFuncProps) => ModalFuncProps)(innerConfig.value)
          : newConfig),
      };
    };

    if (props.modalRef) props.modalRef.value = { destroy: close, update };
    onScopeDispose(() => {
      if (props.modalRef) props.modalRef.value = null;
    });

    const [contextLocale] = useLocale('Modal', defaultLocale.Modal);

    return () => {
      const mergedOkCancel = innerConfig.value.okCancel ?? innerConfig.value.type === 'confirm';
      const prefixCls = config.getPrefixCls('modal');
      const rootPrefixCls = config.getPrefixCls();

      return h(ConfirmDialog, {
        ...(innerConfig.value as unknown as Record<string, unknown>),
        prefixCls,
        rootPrefixCls,
        close,
        open: open.value,
        afterClose,
        okText: fallbackProp(
          innerConfig.value.okText,
          mergedOkCancel ? contextLocale.okText : contextLocale.justOkText,
        ),
        cancelText: fallbackProp(innerConfig.value.cancelText, contextLocale.cancelText),
        direction: innerConfig.value.direction ?? config.direction,
      } as never);
    };
  },
});

// ==============================================================================
// ==                                  Export                                  ==
// ==============================================================================

export default function useModal(): [ModalHookAPI, VNode] {
  let holder: HolderApi | null = null;
  const actionQueue = ref<Array<() => void>>([]);

  // 回放「holder 还没就绪时排下的 destroy / update」
  watch(
    actionQueue,
    (queue) => {
      if (!queue.length) return;
      const cloneQueue = [...queue];
      for (const action of cloneQueue) action();
      actionQueue.value = [];
    },
    { flush: 'post' },
  );

  const getConfirmFunc = (withFunc: (props: ModalFuncProps) => ModalFuncProps) =>
    function hookConfirm(config: ModalFuncProps): ModalInstance {
      uuid += 1;
      const modalRef = ref<HookModalRef | null>(null);

      // 与 `onConfirm` 绑定的 Promise
      let resolvePromise: (confirmed: boolean) => void = () => {};
      const promise = new Promise<boolean>((resolve) => {
        resolvePromise = resolve;
      });

      let silent = false;
      let closeFunc: (() => void) | undefined;

      const modal = h(HookModal, {
        key: `modal-${uuid}`,
        config: withFunc(config),
        modalRef,
        afterClose: () => {
          closeFunc?.();
        },
        isSilent: () => silent,
        onConfirm: (confirmed: boolean) => {
          resolvePromise(confirmed);
        },
      });

      closeFunc = holder?.patchElement(modal);
      if (closeFunc) destroyFns.push(closeFunc);

      const instance: ModalInstance & {
        then?: (resolve: (value: unknown) => void) => unknown;
      } = {
        destroy: () => {
          const destroyAction = (): void => {
            modalRef.value?.destroy();
          };
          if (modalRef.value) destroyAction();
          else actionQueue.value = [...actionQueue.value, destroyAction];
        },
        update: (newConfig) => {
          const updateAction = (): void => {
            modalRef.value?.update(newConfig);
          };
          if (modalRef.value) updateAction();
          else actionQueue.value = [...actionQueue.value, updateAction];
        },
      };

      // ⚠️ `then` 是**契约的一部分**（上游的 instance 就是 thenable：
      //    `await Modal.confirm(...)` 拿到的是「确认结果」，且 `then` 会把 `silent` 置真
      //    ⇒ 之后关闭不触发 `onCancel`）。这里**刻意**做成 thenable。
      // biome-ignore lint/suspicious/noThenProperty: 刻意 thenable，与上游 `instance.then` 同契约
      instance.then = (resolve) => {
        silent = true;
        return promise.then(resolve);
      };

      return instance;
    };

  const fns: ModalHookAPI = {
    info: getConfirmFunc(withInfo),
    success: getConfirmFunc(withSuccess),
    error: getConfirmFunc(withError),
    warning: getConfirmFunc(withWarn),
    warn: getConfirmFunc(withWarn),
    confirm: getConfirmFunc(withConfirm),
  };

  // ⚠️ 这个 vnode **不能带 ref**（见文件头）；holder 实例靠 `onReady` 回调回来
  const contextHolder = h(ElementsHolder, {
    key: 'modal-holder',
    onReady: (api: HolderApi) => {
      holder = api;
    },
  });

  return [fns, contextHolder];
}
