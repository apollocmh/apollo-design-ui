/**
 * `NormalCancelBtn` —— antd `components/modal/components/NormalCancelBtn.tsx` 的 Vue 版。
 *
 * 判据：点击先调 `onCancel`，再调 `cancelButtonProps.onClick`（**上游顺序**）。
 */
import { defineComponent, h, type VNodeChild } from 'vue';

import Button from '../../button/Button.vue';
import { useModalContext } from '../context';
import { normalizeButtonProps } from '../util';

export default defineComponent({
  name: 'AModalNormalCancelBtn',
  setup() {
    const ctx = useModalContext();

    return () => {
      const { cancelButtonProps, cancelTextLocale, onCancel } = ctx.value;
      const onInternalClick = (event: MouseEvent): void => {
        onCancel?.(event);
        cancelButtonProps?.onClick?.(event);
      };

      return h(
        Button,
        { ...normalizeButtonProps(cancelButtonProps), onClick: onInternalClick },
        {
          default: () => cancelTextLocale as VNodeChild,
        },
      );
    };
  },
});
