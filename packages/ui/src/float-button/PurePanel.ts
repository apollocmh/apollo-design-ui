/**
 * FloatButton 的 PurePanel —— antd `PurePanel.tsx` 的 Vue 版（debug-only）。
 *
 * items ⇒ FloatButtonGroup（`-pure` 类）；否则单个 FloatButton
 * （backTop ⇒ BackTop visibilityHeight=0）。
 */

import { defineComponent, h, type PropType } from 'vue';
import { useConfigContext } from '../config-provider/context';
import { clsx } from '../notification/engine/util';
import BackTopComponent from './BackTop';
import FloatButtonComponent, { floatButtonPrefixCls } from './FloatButton';
import FloatButtonGroupComponent from './FloatButtonGroup';
import type { FloatButtonBackTopProps, FloatButtonProps } from './interface';

export interface PureFloatButtonProps extends Omit<FloatButtonProps, 'target'> {
  backTop?: boolean;
}

export interface PurePanelItem extends Omit<PureFloatButtonProps, 'classNames' | 'styles'> {
  key?: string | number;
}

const PureFloatButton = (props: PureFloatButtonProps & { backTop?: boolean }) =>
  props.backTop
    ? h(BackTopComponent, { ...(props as Record<string, unknown>), visibilityHeight: 0 })
    : h(FloatButtonComponent, props as Record<string, unknown>);

const PurePanelComponent = defineComponent({
  name: 'AFloatButtonPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    backTop: { type: Boolean, default: false },
    items: { type: Array as PropType<PurePanelItem[]>, default: undefined },
  },
  setup(props, { attrs }) {
    const { getPrefixCls } = useConfigContext();
    return () => {
      const prefixCls = getPrefixCls(floatButtonPrefixCls, props.prefixCls);
      const pureCls = `${prefixCls}-pure`;

      if (props.items) {
        return h(
          FloatButtonGroupComponent,
          {
            ...(attrs as Record<string, unknown>),
            className: clsx(attrs.class as string | undefined, props.className, pureCls),
          },
          {
            default: () =>
              props.items!.map((item, index) =>
                h(PureFloatButton, { ...item, key: item.key ?? index }),
              ),
          },
        );
      }

      const { items: _items, backTop: _backTop, ...rest } = props;
      void _items;
      void _backTop;
      return h(PureFloatButton, {
        ...(rest as Record<string, unknown>),
        ...(attrs as Record<string, unknown>),
        className: clsx(attrs.class as string | undefined, props.className, pureCls),
      } as never);
    };
  },
});

void (null as unknown as FloatButtonBackTopProps);
export default PurePanelComponent;
