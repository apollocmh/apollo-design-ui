/**
 * `ModalPanel` —— antd `components/modal/shared.tsx` 的 Vue 版（`renderCloseIcon` + `Footer`）。
 *
 * ⚠️ 命名说明：上游文件叫 `shared.tsx`，本仓叫 `ModalPanel.ts`（`modal/` 目录下已有
 *    `engine/Panel.ts`，同名会混）。
 *
 * 逐条对齐上游：
 *   1. `renderCloseIcon(prefixCls, closeIcon)`：包一层 `<span class="{p}-close-x">`，
 *      没给图标时用 `CloseOutlined` 并挂 `{p}-close-icon`；
 *   2. `Footer` 的文案走 `fallbackProp(okText, locale.okText)`（**第一个非 undefined**）；
 *   3. `footer` 是函数或 `undefined` ⇒ 渲染默认的「取消 + 确定」，函数形态会收到
 *      `(originNode, { OkBtn, CancelBtn })`；
 *   4. `footer` 是其它节点 ⇒ **原样渲染**，不进 ModalContext；
 *   5. 整棵树外面包一层 `DisabledContext(disabled: false)` —— **模态框内的按钮
 *      不受全局 `disabled` 影响**（上游的刻意设计）。
 */
import { CloseOutlined } from '@apollo-design/icons';
import { getConfirmLocale, useLocale } from '@apollo-design/locale';
import { isFunction } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, provide, type VNodeChild } from 'vue';

import { disabledContextKey } from '../config-provider/disabled-context';
import NormalCancelBtn from './components/NormalCancelBtn';
import NormalOkBtn from './components/NormalOkBtn';
import { modalContextKey } from './context';
import type { ModalButtonProps, ModalFooterExtra, ModalOkType } from './interface';
import { fallbackProp } from './util';

/** `<span class="{p}-close-x">` 包裹关闭图标（上游 `renderCloseIcon`）。 */
export function renderCloseIcon(prefixCls: string, closeIcon?: VNodeChild): VNodeChild {
  return h(
    'span',
    { class: `${prefixCls}-close-x` },
    closeIcon || h(CloseOutlined, { class: `${prefixCls}-close-icon` }),
  );
}

/** `DisabledContext(disabled: false)` 的提供者（上游的 `DisabledContextProvider`）。 */
const DisabledFalseProvider = defineComponent({
  name: 'AModalDisabledFalseProvider',
  setup(_props, { slots }) {
    provide(
      disabledContextKey,
      computed(() => false),
    );
    return () => slots.default?.();
  },
});

export default defineComponent({
  name: 'AModalFooter',
  inheritAttrs: false,
  props: {
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okType: { type: String as PropType<ModalOkType>, default: undefined },
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    confirmLoading: { type: Boolean, default: undefined },
    onOk: { type: Function as PropType<(e: Event) => void>, default: undefined },
    onCancel: { type: Function as PropType<(e: Event) => void>, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    footer: {
      type: [String, Number, Object, Array, Function, null] as unknown as PropType<unknown>,
      default: undefined,
    },
  },
  setup(props) {
    const [locale] = useLocale('Modal', getConfirmLocale());

    // 上游的 `okType = 'primary'` 默认值
    const mergedOkType = computed<ModalOkType>(() => props.okType ?? 'primary');
    const okTextLocale = computed(() => fallbackProp(props.okText, locale.okText));
    const cancelTextLocale = computed(() => fallbackProp(props.cancelText, locale.cancelText));

    provide(
      modalContextKey,
      computed(() => ({
        confirmLoading: props.confirmLoading,
        okButtonProps: props.okButtonProps,
        cancelButtonProps: props.cancelButtonProps,
        okTextLocale: okTextLocale.value,
        cancelTextLocale: cancelTextLocale.value,
        okType: mergedOkType.value,
        onOk: props.onOk,
        onCancel: props.onCancel,
      })),
    );

    return () => {
      let footerNode: VNodeChild;

      if (isFunction(props.footer) || typeof props.footer === 'undefined') {
        let inner: VNodeChild = [h(NormalCancelBtn), h(NormalOkBtn)];
        if (isFunction(props.footer)) {
          inner = (props.footer as (node: VNodeChild, extra: ModalFooterExtra) => VNodeChild)(
            inner,
            { OkBtn: NormalOkBtn, CancelBtn: NormalCancelBtn },
          );
        }
        footerNode = inner;
      } else {
        footerNode = props.footer as VNodeChild;
      }

      return h(DisabledFalseProvider, null, { default: () => footerNode });
    };
  },
});
