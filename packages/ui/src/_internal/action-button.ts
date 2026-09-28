/**
 * `ActionButton` —— antd `_util/ActionButton.tsx` 的 Vue 版。
 *
 * 用途：那些「点了要执行动作、动作可能异步、异步完才关」的按钮
 * （`Modal.confirm` 的两个按钮、`Popconfirm` 的 OK 按钮）。比普通 `Button` 多三件事：
 *   1. **防重复点击**（`clickedRef`）—— 一次点击只放行一次；
 *   2. **异步 `actionFn` 的 loading**：返回值是 thenable 时自动进 loading，resolve 后才关；
 *   3. **`autoFocus`**：挂载后 `setTimeout(0)` 里聚焦（`preventScroll: true`）。
 *
 * ── 为什么在 `_internal/`（2026-09-28 从 modal 提升）──────────────────────────
 *
 * 第二个消费者是 `Popconfirm`（antd 的 `PurePanel.tsx` 里 `ActionButton` 就来自
 * `_util/`）。Popconfirm 依赖 modal 的私有件会造成**组件间横向依赖**（modal 与
 * popconfirm 在 DAG 里互不相关），所以按 `useOrientation` 提升时的同一套做法：
 * 实现搬到 `_internal/`，`modal/components/ActionButton.ts` 降级为 re-export 垫片
 * （modal 的三个 import 点不动）。
 *
 * ⚠️ 与上游的差异（PLATFORM）：上游用 `actionFn.length` 判断「是否接受 `close` 参数」
 *    （`actionFn.length` 为真则传 `close`）。Vue 侧同样是普通函数，
 *    所以**保留这个判据**（用 `.length`），行为一致。
 */

import { isThenable } from '@apollo-design/utils';
import { defineComponent, h, onMounted, type PropType, ref, type VNodeChild } from 'vue';

import Button from '../button/Button.vue';

/** antd 的 `LegacyButtonType`（`convertLegacyProps` 的输入）。 */
export type LegacyButtonType = 'text' | 'link' | 'primary' | 'default' | 'dashed' | 'danger';

/**
 * antd `buttonHelpers.convertLegacyProps(type)`：`'danger'` / `'ghost'` 是**布尔 prop**
 * 而不是 `type` 的取值，其余原样进 `type`。
 */
export function convertLegacyProps(type?: string): Record<string, unknown> {
  if (type === 'danger' || type === 'ghost') {
    return { [type]: true };
  }
  return type ? { type } : {};
}

/** 传给内部 Button 的属性集合（ButtonProps 的宽松形态，避免与各消费方的类型耦合）。 */
export type ActionButtonProps = Record<string, unknown>;

export default defineComponent({
  name: 'AActionButton',
  inheritAttrs: false,
  props: {
    type: { type: String as PropType<LegacyButtonType | string>, default: undefined },
    prefixCls: { type: String, default: undefined },
    buttonProps: { type: Object as PropType<ActionButtonProps>, default: undefined },
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
