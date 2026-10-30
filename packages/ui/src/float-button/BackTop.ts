/** Back-to-top action with current target, slots and cancellable scrolling. */
import { VerticalAlignTopOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import { isDocument } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  mergeProps,
  onScopeDispose,
  type PropType,
  type SlotsType,
  shallowRef,
} from 'vue';
import { scrollTo } from '../_internal/scroll-to';
import { useComponentConfig } from '../config-provider/context';
import FloatButton, { floatButtonPrefixCls } from './FloatButton';
import useScroll from './hooks/useScroll';
import type {
  FloatButtonBackTopProps,
  FloatButtonRef,
  FloatButtonShape,
  FloatButtonSlots,
  FloatButtonType,
} from './interface';
import { useFloatButtonTheme } from './use-float-button-theme';

export default defineComponent({
  name: 'AFloatButtonBackTop',
  inheritAttrs: false,
  expose: ['nativeElement'],
  slots: Object as SlotsType<FloatButtonSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<FloatButtonType>, default: undefined },
    shape: { type: String as PropType<FloatButtonShape>, default: undefined },
    description: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    tooltip: {
      type: [Object, String] as PropType<FloatButtonBackTopProps['tooltip']>,
      default: undefined,
    },
    badge: { type: Object as PropType<FloatButtonBackTopProps['badge']>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<FloatButtonBackTopProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<FloatButtonBackTopProps['styles']>,
      default: undefined,
    },
    'aria-label': { type: String, default: undefined },
    href: { type: String, default: undefined },
    htmlType: { type: String as PropType<FloatButtonBackTopProps['htmlType']>, default: undefined },
    target: { type: Function as PropType<FloatButtonBackTopProps['target']>, default: undefined },
    visibilityHeight: { type: Number, default: 400 },
    duration: { type: Number, default: 450 },
    showProgress: { type: Boolean, default: false },
  },
  emits: { click: (_event: MouseEvent) => true },
  setup(props, { attrs, slots, emit }) {
    const config = useComponentConfig('floatButton');
    const prefix = computed(() => config.getPrefixCls(floatButtonPrefixCls, props.prefixCls));
    const rootPrefix = computed(() => config.getPrefixCls());
    const theme = useFloatButtonTheme();
    const instance = getCurrentInstance();
    const internalRef = shallowRef<FloatButtonRef | null>(null);
    let cancelScroll: (() => void) | undefined;
    const stopScroll = () => {
      cancelScroll?.();
      cancelScroll = undefined;
    };
    const { visible, scrollProgress, currentTarget } = useScroll({
      getTarget: () => {
        if (props.target) return props.target();
        // A hidden motion root is a real comment anchor in the mount document.
        const anchor: unknown = instance?.vnode.el;
        const owner =
          anchor &&
          typeof anchor === 'object' &&
          'ownerDocument' in anchor &&
          isDocument(anchor.ownerDocument)
            ? anchor.ownerDocument
            : document;
        return internalRef.value?.nativeElement?.ownerDocument ?? owner;
      },
      visibilityHeight: () => props.visibilityHeight,
      showProgress: () => props.showProgress,
      onTargetChange: stopScroll,
    });
    onScopeDispose(stopScroll);
    const scrollToTop = (event: MouseEvent) => {
      stopScroll();
      const reduced = internalRef.value?.nativeElement?.ownerDocument.defaultView?.matchMedia?.(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      cancelScroll = scrollTo(0, {
        getContainer: () => currentTarget.value,
        duration: reduced || !theme.motion.value ? 0 : props.duration,
      });
      emit('click', event);
    };
    const renderBackTop = () =>
      h(
        CSSMotion,
        {
          visible: visible.value,
          motionName: theme.motion.value ? `${rootPrefix.value}-fade` : undefined,
        },
        {
          default: ({
            className,
            style,
          }: {
            className: string;
            style: Record<string, string | number> | null;
          }) =>
            h(
              FloatButton,
              mergeProps(
                {
                  style: [
                    style,
                    props.showProgress
                      ? { [`--${prefix.value}-progress`]: `${scrollProgress.value}turn` }
                      : undefined,
                  ],
                },
                attrs,
                {
                  ref: internalRef,
                  prefixCls: props.prefixCls,
                  type: props.type,
                  shape: props.shape,
                  disabled: props.disabled,
                  description: props.description,
                  tooltip: props.tooltip,
                  badge: props.badge,
                  classNames: props.classNames,
                  styles: props.styles,
                  'aria-label':
                    props['aria-label'] ??
                    (slots.content || props.description !== undefined ? undefined : 'Back to top'),
                  href: props.href,
                  htmlType: props.htmlType,
                  hidden: !visible.value,
                  onClick: scrollToTop,
                  class: [className, props.showProgress && `${prefix.value}-progress`],
                },
              ),
              {
                ...(slots.content ? { content: () => slots.content?.() } : {}),
                icon: () =>
                  slots.icon
                    ? slots.icon()
                    : !slots.content && props.description === undefined
                      ? h(VerticalAlignTopOutlined)
                      : null,
              },
            ),
        },
      );
    return {
      get nativeElement() {
        return internalRef.value?.nativeElement ?? null;
      },
      renderBackTop,
    };
  },
  render() {
    return this.renderBackTop();
  },
});
