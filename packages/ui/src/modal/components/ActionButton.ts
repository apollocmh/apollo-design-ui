/**
 * `ActionButton` —— antd `_util/ActionButton.tsx` 的 Vue 版。
 *
 * 用途：`Modal.confirm` 的两个按钮。它比普通 `Button` 多三件事：
 *   1. **防重复点击**（`clickedRef`）—— 一次点击只放行一次；
 *   2. **异步 `onOk` 的 loading**：返回值是 thenable 时自动进 loading，resolve 后才关；
 *   3. **`autoFocus`**：挂载后 `setTimeout(0)` 里聚焦（`preventScroll: true`）。
 *
 * ⚠️ 与上游的差异（PLATFORM）：上游用 `actionFn.length` 判断「是否接受 `close` 参数」
 *    （`actionFn.length` 为真则传 `close`）。Vue 侧同样是普通函数，
 *    所以**保留这个判据**（用 `.length`），行为一致。
 */
import { isThenable } from '@apollo-design/utils';
import { defineComponent, h, onMounted, type PropType, ref, type VNodeChild } from 'vue';

import Button from '../../button/Button.vue';
import type { ModalButtonProps, ModalOkType } from '../interface';
import { convertLegacyProps } from '../util';

export default defineComponent({
  name: 'AModalActionButton',
  inheritAttrs: false,
  props: {
    type: { type: String as PropType<ModalOkType>, default: undefined },
    prefixCls: { type: String, default: undefined },
    buttonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    autoFocus: { type: Boolean, default: false },
    emitEvent: { type: Boolean, default: false },
    isSilent: { type: Function as PropType<() => boolean>, default: undefined },
    quitOnNullishReturnValue: { type: Boolean, default: false },
    actionFn: { type: Function as PropType<(...args: never[]) => unknown>, default: undefined },
  },
  setup(props, { slots }) {
    const clicked = ref(false);
    const loading = ref(false);
    const buttonRef = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);

    const resolveElement = (): HTMLElement | null => {
      const inst = buttonRef.value;
      if (!inst) return null;
      if (inst instanceof HTMLElement) return inst;
      return inst.$el ?? null;
    };

    onMounted(() => {
      if (!props.autoFocus) return;
      // 上游用 setTimeout(0)：等面板动效起步后再聚焦，避免被 overflow 抢走
      setTimeout(() => {
        resolveElement()?.focus({ preventScroll: true });
      });
    });

    const onInternalClose = (...args: unknown[]): void => {
      props.close?.(...args);
    };

    const handlePromiseOnOk = (returnValue: unknown): void => {
      if (!isThenable(returnValue)) return;
      loading.value = true;
      returnValue.then(
        (...args: unknown[]) => {
          loading.value = false;
          onInternalClose(...args);
          clicked.value = false;
        },
        (e: unknown) => {
          // https://github.com/ant-design/ant-design/issues/6183
          loading.value = false;
          clicked.value = false;
          // `await` 模式下不抛（`isSilent` 为真）
          if (props.isSilent?.()) return;
          return Promise.reject(e);
        },
      );
    };

    const onClick = (e: MouseEvent): void => {
      if (clicked.value) return;
      clicked.value = true;

      const actionFn = props.actionFn;
      if (!actionFn) {
        onInternalClose();
        return;
      }

      let returnValue: unknown;
      if (props.emitEvent) {
        returnValue = actionFn(e as never);
        if (props.quitOnNullishReturnValue && !isThenable(returnValue)) {
          clicked.value = false;
          onInternalClose(e);
          return;
        }
      } else if (actionFn.length) {
        returnValue = actionFn(onInternalClose as never);
        // https://github.com/ant-design/ant-design/issues/23358
        clicked.value = false;
      } else {
        returnValue = actionFn();
        if (!isThenable(returnValue)) {
          onInternalClose();
          return;
        }
      }

      handlePromiseOnOk(returnValue);
    };

    return () =>
      h(
        Button,
        {
          ...convertLegacyProps(props.type),
          onClick,
          loading: loading.value,
          prefixCls: props.prefixCls,
          ...props.buttonProps,
          ref: buttonRef,
        } as never,
        { default: () => slots.default?.() as VNodeChild },
      );
  },
});
