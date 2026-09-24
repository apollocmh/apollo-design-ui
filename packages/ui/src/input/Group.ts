/**
 * Input.Group —— **deprecated**，等价于 `Space.Compact`（antd 6.6.4 同判）。
 *
 * 两条必须保留的判据：
 *  1. 常量告警：`Input.Group` 出现即提示改用 `Space.Compact`（不是条件告警）。
 *  2. Form.Item 上下文要**降级**：group 内 `isFormItemInput = false`
 *     （否则子输入框会都加上 `-in-form-item`）。
 */

import { useDevWarning } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, provide } from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { formItemInputContextKey, useFormItemInputContext } from '../form/context';
import { SpaceCompact } from '../space';
import type { InputGroupProps } from './interface';

export const GroupComponent = defineComponent({
  name: 'AInputGroup',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<InputGroupProps['style']>, default: undefined },
    size: { type: String as PropType<InputGroupProps['size']>, default: undefined },
    compact: { type: Boolean, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const devWarning = useDevWarning('Input.Group');
    devWarning.deprecated(false, 'Input.Group', 'Space.Compact');

    const { getPrefixCls } = useComponentConfig('input');
    const direction = useDirection();
    const formItemContext = useFormItemInputContext();

    const prefixCls = computed(() => getPrefixCls('input-group', props.prefixCls));

    provide(formItemInputContextKey, {
      ...formItemContext.value,
      isFormItemInput: false,
    });

    const cls = computed(() => [
      prefixCls.value,
      {
        [`${prefixCls.value}-lg`]: props.size === 'large',
        [`${prefixCls.value}-sm`]: props.size === 'small',
        [`${prefixCls.value}-compact`]: props.compact,
        [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
      },
      props.className,
    ]);

    return () =>
      h(
        SpaceCompact,
        {
          class: cls.value,
          style: props.style,
          ...attrs,
        } as never,
        { default: () => slots.default?.() },
      );
  },
});
