import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  type SlotsType,
  type VNodeChild,
} from 'vue';

import { disabledContextKey } from '../config-provider/disabled-context';
import NormalCancelBtn from './components/NormalCancelBtn';
import NormalOkBtn from './components/NormalOkBtn';
import { modalContextKey } from './context';
import type { ModalButtonProps, ModalFooterExtra, ModalOkType } from './interface';
import { fallbackProp } from './util';

/** `<span class="{p}-close-x">` 包裹关闭图标（上游 `renderCloseIcon`）。 */
export function renderCloseIcon(prefixCls: string, closeIcon?: VNodeChild): VNodeChild {
  return h('span', { class: `${prefixCls}-close-x` }, [
    closeIcon ?? h(CloseOutlined, { class: `${prefixCls}-close-icon` }),
  ]);
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
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okType: { type: String as PropType<ModalOkType>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    confirmLoading: { type: Boolean, default: undefined },
    onOk: { type: Function as PropType<(e: Event) => void>, default: undefined },
    onCancel: { type: Function as PropType<(e: Event) => void>, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
  },
  slots: {} as SlotsType<{ default?: (scope: ModalFooterExtra) => VNodeChild }>,
  setup(props, { slots }) {
    const [locale] = useLocale('Modal');

    // 上游的 `okType = 'primary'` 默认值
    const mergedOkType = computed<ModalOkType>(() => props.okType ?? 'primary');
    const okTextLocale = computed(() => fallbackProp(props.okText, locale.value.okText));
    const cancelTextLocale = computed(() =>
      fallbackProp(props.cancelText, locale.value.cancelText),
    );

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

    return () =>
      h(DisabledFalseProvider, null, {
        default: () =>
          slots.default
            ? slots.default({ OkBtn: NormalOkBtn, CancelBtn: NormalCancelBtn })
            : [h(NormalCancelBtn), h(NormalOkBtn)],
      });
  },
});
