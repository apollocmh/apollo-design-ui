/**
 * `NormalOkBtn` —— antd `components/modal/components/NormalOkBtn.tsx` 的 Vue 版。
 *
 * ⚠️ 展开顺序是 `{...convertLegacyProps(okType), loading, onClick: onOk, ...okButtonProps}` ——
 * `okButtonProps` **最后展开**，所以用户能在它里面覆盖 `loading` / `onClick`。
 * 顺序不能换。
 */
import { defineComponent, h, type VNodeChild } from 'vue';

import Button from '../../button/Button.vue';
import { useModalContext } from '../context';
import { convertLegacyProps } from '../util';

export default defineComponent({
  name: 'AModalNormalOkBtn',
  setup() {
    const ctx = useModalContext();

    return () => {
      const { confirmLoading, okButtonProps, okType, okTextLocale, onOk } = ctx.value;

      return h(
        Button,
        {
          ...convertLegacyProps(okType),
          loading: confirmLoading,
          onClick: onOk,
          ...okButtonProps,
        } as never,
        { default: () => okTextLocale as VNodeChild },
      );
    };
  },
});
