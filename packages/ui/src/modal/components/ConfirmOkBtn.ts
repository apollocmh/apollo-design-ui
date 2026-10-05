/**
 * `ConfirmOkBtn` —— antd `components/modal/components/ConfirmOkBtn.tsx` 的 Vue 版。
 *
 * 判据：
 *   1. `type = okType || 'primary'`；
 *   2. `close` 的回调体顺序是 `close(...) → onConfirm(true) → onClose()`；
 *   3. `autoFocus = autoFocusButton === 'ok'`（**默认就是它**，见 ConfirmContent 的默认值）；
 *   4. `prefixCls` 是 **`{rootPrefixCls}-btn`**。
 */
import { defineComponent, h, type VNodeChild } from 'vue';

import { useModalContext } from '../context';
import ActionButton from './ActionButton';

export default defineComponent({
  name: 'AModalConfirmOkBtn',
  setup() {
    const ctx = useModalContext();

    return () => {
      const {
        autoFocusButton,
        close,
        isSilent,
        okButtonProps,
        rootPrefixCls,
        okTextLocale,
        okType,
        onConfirm,
        onOk,
        onClose,
      } = ctx.value;

      return h(
        ActionButton,
        {
          isSilent,
          type: okType || 'primary',
          actionFn: onOk as never,
          close: (...args: unknown[]) => {
            close?.(...args);
            onConfirm?.(true);
            onClose?.();
          },
          autoFocus: autoFocusButton === 'ok',
          // 根类名/样式走 Vue 原生 attrs；`className` / `rootClassName` 已被类型层拒绝。
          buttonProps: {
            ...okButtonProps,
            class: okButtonProps?.class,
            style: okButtonProps?.style,
          },
          prefixCls: `${rootPrefixCls}-btn`,
        } as never,
        { default: () => okTextLocale as VNodeChild },
      );
    };
  },
});
