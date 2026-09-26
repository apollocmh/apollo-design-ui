/**
 * `ConfirmCancelBtn` —— antd `components/modal/components/ConfirmCancelBtn.tsx` 的 Vue 版。
 *
 * 判据：
 *   1. `mergedOkCancel` 为假 ⇒ **不渲染**（`Modal.info` 这类只有一个 OK 的形态）；
 *   2. `close` 的回调体顺序是 `close(...) → onConfirm(false) → onClose()`；
 *   3. `autoFocus = autoFocusButton === 'cancel'`；
 *   4. `prefixCls` 是 **`{rootPrefixCls}-btn`**（不是 `{p}-modal-btn`）。
 */
import { defineComponent, h, type VNodeChild } from 'vue';

import { useModalContext } from '../context';
import ActionButton from './ActionButton';

export default defineComponent({
  name: 'AModalConfirmCancelBtn',
  setup() {
    const ctx = useModalContext();

    return () => {
      const {
        autoFocusButton,
        cancelButtonProps,
        cancelTextLocale,
        isSilent,
        mergedOkCancel,
        rootPrefixCls,
        close,
        onCancel,
        onConfirm,
        onClose,
      } = ctx.value;

      if (!mergedOkCancel) return null;

      return h(
        ActionButton,
        {
          isSilent,
          actionFn: onCancel as never,
          close: (...args: unknown[]) => {
            close?.(...args);
            onConfirm?.(false);
            onClose?.();
          },
          autoFocus: autoFocusButton === 'cancel',
          buttonProps: cancelButtonProps,
          prefixCls: `${rootPrefixCls}-btn`,
        } as never,
        { default: () => cancelTextLocale as VNodeChild },
      );
    };
  },
});
