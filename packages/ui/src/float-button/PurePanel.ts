/** Debug panel composed from the same native FloatButton/Group/BackTop contracts. */
import { defineComponent, h, mergeProps, type PropType, type SlotsType } from 'vue';
import { useConfigContext } from '../config-provider/context';
import BackTop from './BackTop';
import FloatButton, { floatButtonPrefixCls } from './FloatButton';
import Group from './FloatButtonGroup';
import type { FloatButtonProps, FloatButtonSlots } from './interface';

export interface PureFloatButtonProps extends Omit<FloatButtonProps, 'target'> {
  backTop?: boolean;
}
export interface PurePanelItem extends Omit<PureFloatButtonProps, 'classNames' | 'styles'> {
  key?: string | number;
}

export default defineComponent({
  name: 'AFloatButtonPurePanel',
  inheritAttrs: false,
  slots: Object as SlotsType<FloatButtonSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    backTop: { type: Boolean, default: false },
    items: { type: Array as PropType<PurePanelItem[]>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const config = useConfigContext();
    return () => {
      const prefix = config.getPrefixCls(floatButtonPrefixCls, props.prefixCls);
      const root = mergeProps(attrs, { prefixCls: props.prefixCls, class: `${prefix}-pure` });
      if (props.items)
        return h(Group, root, {
          default: () =>
            props.items?.map((item, index) => {
              const { backTop, key, ...button } = item;
              const common = { prefixCls: props.prefixCls, ...button, key: key ?? index };
              return backTop
                ? h(BackTop, { ...common, visibilityHeight: 0 })
                : h(FloatButton, common);
            }),
        });
      return props.backTop
        ? h(BackTop, { ...root, visibilityHeight: 0 }, slots)
        : h(FloatButton, root, slots);
    };
  },
});
