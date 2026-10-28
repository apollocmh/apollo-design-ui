import { defineComponent, h, mergeProps, type SlotsType, shallowRef } from 'vue';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { provideLayoutContext } from './context';
import { useHasSider } from './hooks/use-has-sider';
import type { LayoutConfig, LayoutGeneratorConfig, LayoutSlots } from './interface';
import { useLayoutTheme } from './use-layout-theme';

const prefixProp = { type: String, default: undefined };
const layoutProps = {
  prefixCls: prefixProp,
  hasSider: { type: Boolean, default: undefined },
};

function createBasic({ suffixCls, tagName, displayName }: LayoutGeneratorConfig) {
  return defineComponent({
    name: displayName,
    inheritAttrs: false,
    props: { prefixCls: prefixProp },
    slots: Object as SlotsType<LayoutSlots>,
    setup(props, { attrs, expose, slots }) {
      const context = useComponentConfig<LayoutConfig>('layout');
      const direction = useDirection();
      const componentPrefix = () =>
        props.prefixCls || context.getPrefixCls('layout') + (suffixCls ? '-' + suffixCls : '');
      const themeStyle = useLayoutTheme(() => {
        const prefix = componentPrefix();
        return suffixCls && prefix.endsWith('-' + suffixCls)
          ? prefix.slice(0, -suffixCls.length - 1)
          : prefix;
      });
      const rootRef = shallowRef<HTMLElement | null>(null);
      expose({
        get nativeElement() {
          return rootRef.value;
        },
      });
      return () =>
        h(
          tagName,
          mergeProps(
            {
              ref: rootRef,
              class: componentPrefix(),
              style: themeStyle.value,
              dir: direction.value,
            },
            attrs,
          ),
          [slots.default?.()],
        );
    },
  });
}

export const LayoutComponent = defineComponent({
  name: 'ALayout',
  inheritAttrs: false,
  props: layoutProps,
  slots: Object as SlotsType<LayoutSlots>,
  setup(props, { attrs, expose, slots }) {
    const context = useComponentConfig<LayoutConfig>('layout');
    const direction = useDirection();
    const themeStyle = useLayoutTheme(() => context.getPrefixCls('layout', props.prefixCls));
    const rootRef = shallowRef<HTMLElement | null>(null);
    const siders = shallowRef<string[]>([]);
    provideLayoutContext({
      siderHook: {
        addSider: (id) => {
          siders.value = [...siders.value, id];
        },
        removeSider: (id) => {
          siders.value = siders.value.filter((current) => current !== id);
        },
      },
    });
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });
    return () => {
      const prefix = context.getPrefixCls('layout', props.prefixCls);
      const children = slots.default?.();
      return h(
        'div',
        mergeProps(
          {
            ref: rootRef,
            class: [
              prefix,
              {
                [prefix + '-has-sider']: useHasSider(siders.value, children, props.hasSider),
                [prefix + '-rtl']: direction.value === 'rtl',
              },
              context.className,
            ],
            style: [themeStyle.value, context.style],
          },
          attrs,
        ),
        [children],
      );
    };
  },
});

export const Header = createBasic({
  suffixCls: 'header',
  tagName: 'header',
  displayName: 'ALayoutHeader',
});
export const Footer = createBasic({
  suffixCls: 'footer',
  tagName: 'footer',
  displayName: 'ALayoutFooter',
});
export const Content = createBasic({
  suffixCls: 'content',
  tagName: 'main',
  displayName: 'ALayoutContent',
});
export const layoutPropTypes = layoutProps;
export default LayoutComponent;
