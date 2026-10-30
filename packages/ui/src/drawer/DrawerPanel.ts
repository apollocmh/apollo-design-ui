/**
 * Internal header/body/footer content; public content enters through Drawer slots.
 * Historical reference: antd 6.6.4 components/drawer/DrawerPanel.tsx.
 */
import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { isRenderable } from '@apollo-design/utils';
import { type CSSProperties, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { Skeleton } from '../skeleton';
import type { DrawerClosable, DrawerSemanticType } from './interface';

const contentType = [String, Number, Boolean, Object, Array] as PropType<VNodeChild>;

export default defineComponent({
  name: 'ADrawerPanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    ariaId: { type: String, default: undefined },
    title: { type: contentType, default: undefined },
    footer: { type: contentType, default: undefined },
    extra: { type: contentType, default: undefined },
    closeIcon: { type: contentType, default: undefined },
    closable: { type: [Boolean, Object] as PropType<DrawerClosable>, default: undefined },
    onClose: { type: Function as PropType<(event: Event) => void>, default: undefined },
    classNames: { type: Object as PropType<DrawerSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<DrawerSemanticType['styles']>, default: undefined },
    loading: { type: Boolean, default: false },
    headerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    bodyStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    footerStyle: { type: Object as PropType<CSSProperties>, default: undefined },
  },
  setup(props, { slots }) {
    const config = useComponentConfig<{ closable?: DrawerClosable }>('drawer');
    const [locale] = useLocale('global');

    return () => {
      const prefix = props.prefixCls;
      const cn = props.classNames ?? {};
      const st = props.styles ?? {};
      const contextClose = config.closable;
      const customClose = props.closable;
      const closeConfig = {
        ...(typeof contextClose === 'object' && contextClose),
        ...(typeof customClose === 'object' && customClose),
      };
      const closeIcon =
        props.closeIcon !== undefined
          ? props.closeIcon
          : closeConfig.closeIcon !== undefined
            ? closeConfig.closeIcon
            : h(CloseOutlined);
      const closable = (customClose ?? contextClose) !== false && isRenderable(closeIcon);
      const placement = closeConfig.placement ?? 'start';
      const closeButton = closable
        ? h(
            'button',
            {
              type: 'button',
              disabled: closeConfig.disabled,
              onClick: closeConfig.disabled ? undefined : props.onClose,
              'aria-label': closeConfig['aria-label'] ?? locale.value.close,
              class: [`${prefix}-close`, placement === 'end' && `${prefix}-close-end`, cn.close],
              style: st.close,
            },
            [closeIcon],
          )
        : null;
      const hasTitle = isRenderable(props.title);
      const hasExtra = isRenderable(props.extra);
      const header =
        !hasTitle && !closable && !hasExtra
          ? null
          : h(
              'div',
              {
                key: 'header',
                class: [
                  `${prefix}-header`,
                  cn.header,
                  closable && !hasTitle && !hasExtra && `${prefix}-header-close-only`,
                ],
                style: [st.header, props.headerStyle],
              },
              [
                h('div', { class: `${prefix}-header-title` }, [
                  placement === 'start' ? closeButton : null,
                  hasTitle
                    ? h(
                        'div',
                        { id: props.ariaId, class: [`${prefix}-title`, cn.title], style: st.title },
                        [props.title],
                      )
                    : null,
                ]),
                hasExtra
                  ? h('div', { class: [`${prefix}-extra`, cn.extra], style: st.extra }, [
                      props.extra,
                    ])
                  : null,
                placement === 'end' ? closeButton : null,
              ],
            );
      return [
        header,
        h(
          'div',
          { key: 'body', class: [`${prefix}-body`, cn.body], style: [st.body, props.bodyStyle] },
          props.loading
            ? [
                h(Skeleton, {
                  active: true,
                  title: false,
                  paragraph: { rows: 5 },
                  class: `${prefix}-body-skeleton`,
                }),
              ]
            : slots.default?.(),
        ),
        isRenderable(props.footer)
          ? h(
              'div',
              {
                key: 'footer',
                class: [`${prefix}-footer`, cn.footer],
                style: [st.footer, props.footerStyle],
              },
              [props.footer],
            )
          : null,
      ];
    };
  },
});
