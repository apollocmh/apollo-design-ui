import { isEmptyVNode } from '@apollo-design/utils';
import {
  defineComponent,
  h,
  normalizeClass,
  normalizeStyle,
  type PropType,
  type SlotsType,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { ConfirmContent } from './ConfirmDialog';
import NormalCancelBtn from './components/NormalCancelBtn';
import NormalOkBtn from './components/NormalOkBtn';
import Panel from './engine/Panel';
import type {
  ModalProps,
  ModalPurePanelProps,
  ModalSemanticType,
  ModalSlots,
  ModalType,
} from './interface';
import ModalPanel, { renderCloseIcon } from './ModalPanel';
import { useModalTheme } from './use-modal-theme';

export default defineComponent({
  name: 'AModalPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    closable: { type: [Boolean, Object] as PropType<ModalProps['closable']>, default: undefined },
    type: { type: String as PropType<ModalType>, default: undefined },
    title: { type: String, default: undefined },
    content: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<ModalProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<ModalProps['styles']>, default: undefined },
  },
  slots: {} as SlotsType<ModalSlots & { content?: () => import('vue').VNodeChild }>,
  setup(props, { attrs, slots }) {
    const config = useComponentConfig<
      ModalProps & { className?: string; style?: import('vue').CSSProperties }
    >('modal');
    const theme = useModalTheme();
    const semantic = useMergeSemantic<
      ModalPurePanelProps,
      NonNullable<ModalSemanticType['classNames']>,
      NonNullable<ModalSemanticType['styles']>
    >(
      [() => config.classNames, () => props.classNames],
      [() => config.styles, () => props.styles],
      () => props,
    );
    return () => {
      const prefixCls = props.prefixCls ?? config.getPrefixCls('modal');
      const cn = semantic.classNames.value;
      const st = semantic.styles.value;
      const { class: rootClass, style: rootStyle, ...nativeAttrs } = attrs;
      const title = slots.title ? slots.title() : props.title;
      const footerContent = slots.footer?.({ OkBtn: NormalOkBtn, CancelBtn: NormalCancelBtn });
      const children = props.type
        ? h(ConfirmContent, {
            prefixCls,
            confirmPrefixCls: `${prefixCls}-confirm`,
            rootPrefixCls: config.getPrefixCls(),
            type: props.type,
            title,
            content: slots.content
              ? slots.content()
              : slots.default
                ? slots.default()
                : props.content,
            closable: props.closable ?? false,
            contentClassName: cn.body,
            contentStyle: st.body,
          })
        : slots.default?.();
      return h(
        Panel,
        {
          ...nativeAttrs,
          prefixCls,
          className: normalizeClass([
            `${prefixCls}-pure-panel`,
            props.type && `${prefixCls}-confirm`,
            props.type && `${prefixCls}-confirm-${props.type}`,
            rootClass,
            config.className,
            cn.root,
          ]),
          style: [theme.style.value, config.style, normalizeStyle(rootStyle), st.root],
          classNames: cn,
          styles: st,
          closeIcon: renderCloseIcon(prefixCls, slots.closeIcon?.()),
          closable: props.closable ?? !props.type,
          title: props.type ? undefined : title,
          footer:
            props.type || (slots.footer && isEmptyVNode(footerContent))
              ? undefined
              : h(ModalPanel, null, slots.footer ? { default: () => footerContent } : undefined),
        },
        {
          default: () => children,
          ...(slots.modalRender ? { modalRender: slots.modalRender } : {}),
        },
      );
    };
  },
});
