/**
 * FloatButton.BackTop —— antd `BackTop.tsx`（121 行）的 Vue 版。
 *
 * 复用 back-top 的滚动基建（getScroll / throttleByAnimationFrame / scrollTo /
 * CSSMotion fade）+ 本目录 hooks/useScroll（showProgress 进度环）。
 */

import { VerticalAlignTopOutlined } from '@apollo-design/icons';
import { CSSMotion } from '@apollo-design/motion';
import { useDevWarning } from '@apollo-design/utils';
import {
  type ComponentPublicInstance,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
} from 'vue';
import { scrollTo } from '../_internal/scroll-to';
import { useComponentConfig } from '../config-provider/context';
import { useFloatButtonGroup } from './context';
import FloatButtonComponent, { floatButtonPrefixCls } from './FloatButton';
import useScroll from './hooks/useScroll';
import type { FloatButtonBackTopProps, FloatButtonShape, FloatButtonType } from './interface';

const BackTopComponent = defineComponent({
  name: 'AFloatButtonBackTop',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    type: { type: String as PropType<FloatButtonType>, default: undefined },
    shape: { type: String as PropType<FloatButtonShape>, default: undefined },
    description: { type: String, default: undefined },
    tooltip: {
      type: [Object, String] as PropType<FloatButtonBackTopProps['tooltip']>,
      default: undefined,
    },
    badge: { type: Object as PropType<FloatButtonBackTopProps['badge']>, default: undefined },
    'aria-label': { type: String, default: undefined },
    href: { type: String, default: undefined },
    htmlType: { type: String as PropType<FloatButtonBackTopProps['htmlType']>, default: undefined },
    // antd：BackTopProps omit 掉 FloatButton 的 anchor `target` 后重声明为滚动容器
    target: {
      type: Function as PropType<FloatButtonBackTopProps['target']>,
      default: undefined,
    },
    visibilityHeight: { type: Number, default: 400 },
    duration: { type: Number, default: 450 },
    showProgress: { type: Boolean, default: false },
    onClick: {
      type: Function as PropType<FloatButtonBackTopProps['onClick']>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose }) {
    const devWarning = useDevWarning('FloatButton.BackTop');
    const { getPrefixCls } = useComponentConfig('floatButton' as never);
    void devWarning;

    const prefixCls = computed(() => getPrefixCls(floatButtonPrefixCls, props.prefixCls));
    const rootPrefixCls = computed(() => getPrefixCls());

    const internalRef = ref<ComponentPublicInstance | null>(null);
    expose({
      get nativeElement() {
        return (
          (internalRef.value as unknown as { nativeElement?: HTMLElement | null } | null)
            ?.nativeElement ?? null
        );
      },
    });

    /** antd 逐字：`ref.current?.ownerDocument || window`。 */
    const getDefaultTarget = (): HTMLElement | Window | Document =>
      (internalRef.value as unknown as { nativeElement?: HTMLElement | null } | null)?.nativeElement
        ?.ownerDocument ?? window;

    const getTarget = (): HTMLElement | Window | Document =>
      props.target ? props.target() : getDefaultTarget();

    const { scrollProgress, visible } = useScroll({
      getTarget,
      showProgress: props.showProgress,
      visibilityHeight: props.visibilityHeight ?? 400,
    });

    const groupShape = useFloatButtonGroup()?.shape ?? null;
    const mergedShape = computed<FloatButtonShape>(() => groupShape ?? props.shape ?? 'circle');
    const mergedType = computed<FloatButtonType>(() => props.type ?? 'default');

    const scrollToTop = (e: MouseEvent): void => {
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      scrollTo(0, {
        getContainer: () => getTarget(),
        duration: prefersReducedMotion?.matches ? 0 : (props.duration ?? 450),
      });
      props.onClick?.(e);
    };

    return () => {
      const styleObj = {
        // 根 style 是 Vue 原生 attrs
        ...(typeof attrs.style === 'object' ? attrs.style : {}),
        ...(props.showProgress
          ? { [`--${prefixCls.value}-progress`]: `${scrollProgress.value}turn` }
          : {}),
      };

      return h(
        CSSMotion,
        { visible: visible.value, motionName: `${rootPrefixCls.value}-fade` },
        {
          default: ({ className: motionClassName }: { className?: string }) =>
            h(
              FloatButtonComponent,
              {
                ...attrs,
                ref: internalRef,
                prefixCls: props.prefixCls,
                type: mergedType.value,
                shape: mergedShape.value,
                description: props.description,
                tooltip: props.tooltip,
                badge: props.badge,
                'aria-label': props['aria-label'],
                href: props.href,
                htmlType: props.htmlType,
                onClick: scrollToTop,
                style: styleObj,
                // FloatButton 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
                class: [
                  attrs.class as string | undefined,
                  motionClassName,
                  props.showProgress ? `${prefixCls.value}-progress` : '',
                ]
                  .filter(Boolean)
                  .join(' '),
              } as never,
              // BackTop 无内容（icon-only；默认 VerticalAlignTopOutlined 在 FloatButton
              // 的 icon 兜底之前 —— antd 走 mergedIcon 默认值）
              {
                icon: () =>
                  props.description === undefined ? h(VerticalAlignTopOutlined) : (null as never),
                default: () => null,
              },
            ),
        },
      );
    };
  },
});

export default BackTopComponent;
