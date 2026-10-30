/**
 * Popup DOM, motion, native focus, nested push ownership and resize behavior.
 * Historical reference: @rc-component/drawer 1.4.2 es/DrawerPopup.js.
 */
import { CSSMotion, type CSSMotionSlotProps } from '@apollo-design/motion';
import { useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  inject,
  onScopeDispose,
  type PropType,
  provide,
  ref,
  shallowReactive,
  watch,
} from 'vue';
import type { DrawerPlacement, DrawerRef, DrawerSemanticType, PushState } from '../interface';
import { type DrawerContextValue, drawerContextKey } from './context';
import DrawerSection from './DrawerSection';
import { useDrag } from './useDrag';
import { useFocusable } from './useFocusable';
import { toCssSize } from './util';

export interface DrawerMotion {
  motionName?: string;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionDeadline?: number;
}
export interface DrawerPopupRef extends DrawerRef {
  restoreFocus: () => void;
}

export default defineComponent({
  name: 'ADrawerPopup',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    open: { type: Boolean, default: false },
    placement: { type: String as PropType<DrawerPlacement>, default: 'right' },
    inline: { type: Boolean, default: false },
    push: { type: [Boolean, Object] as PropType<boolean | PushState>, default: undefined },
    forceRender: { type: Boolean, default: false },
    autoFocus: { type: Boolean, default: true },
    focusTrap: { type: Boolean, default: undefined },
    focusTriggerAfterClose: { type: Boolean, default: undefined },
    classNames: { type: Object as PropType<DrawerSemanticType['classNames']>, default: undefined },
    styles: { type: Object as PropType<DrawerSemanticType['styles']>, default: undefined },
    zIndex: { type: Number, default: undefined },
    motion: {
      type: [Object, Function] as PropType<DrawerMotion | ((placement: string) => DrawerMotion)>,
      default: undefined,
    },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    size: { type: [String, Number] as PropType<string | number>, default: undefined },
    maxSize: { type: Number, default: undefined },
    mask: { type: Boolean, default: true },
    maskClosable: { type: Boolean, default: true },
    maskMotion: { type: Object as PropType<DrawerMotion>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    onClose: { type: Function as PropType<(event: Event) => void>, default: undefined },
    resizable: { type: Boolean, default: false },
    defaultSize: { type: Number, default: undefined },
  },
  emits: {
    resize: (_size: number) => true,
    resizeStart: (_size: number) => true,
    resizeEnd: (_size: number) => true,
  },
  setup(props, { attrs, slots, emit, expose }) {
    const panel = ref<HTMLElement | null>(null);
    const wrapper = ref<HTMLElement | null>(null);
    const restoreFocus = useFocusable(
      () => panel.value,
      () => props.open,
      () => props.autoFocus,
      () => props.focusTrap,
      () => props.mask,
      () => props.focusTriggerAfterClose,
    );
    expose({
      nativeElement: panel,
      focus: (options?: FocusOptions) => panel.value?.focus(options),
      restoreFocus,
    });

    const children = shallowReactive(new Set<symbol>());
    const parent = inject(drawerContextKey, null);
    const registration = Symbol('drawer-child');
    const pushDistance = computed(() => {
      const push = props.push;
      if (push === false) return 0;
      return (
        (typeof push === 'object' ? push.distance : undefined) ?? parent?.value.pushDistance ?? 180
      );
    });
    provide(
      drawerContextKey,
      computed<DrawerContextValue>(() => ({
        pushDistance: pushDistance.value,
        push: (child) => children.add(child),
        pull: (child) => children.delete(child),
      })),
    );
    watch(
      () => props.open,
      (open) => {
        if (open) parent?.value.push(registration);
        else parent?.value.pull(registration);
      },
      { immediate: true },
    );
    onScopeDispose(() => parent?.value.pull(registration));

    const isHorizontal = computed(() => props.placement === 'left' || props.placement === 'right');
    const parseSize = (value?: string | number): string | number | undefined => {
      if (typeof value === 'string') {
        const num = Number(value.replace(/px$/i, ''));
        if (!Number.isNaN(num)) return num;
      }
      return value;
    };
    const requestedSize = computed(
      () => props.size ?? (isHorizontal.value ? props.width : props.height),
    );
    const [currentSize, setCurrentSize] = useControlledValue<string | number | undefined>({
      defaultValue: undefined,
      getValue: () => requestedSize.value,
    });
    watch(
      () => props.placement,
      () => setCurrentSize(undefined),
    );
    const mergedSize = computed(() =>
      parseSize(currentSize.value ?? props.defaultSize ?? (isHorizontal.value ? 378 : undefined)),
    );
    const wrapperStyle = computed<CSSProperties>(() => {
      const style: CSSProperties = isHorizontal.value
        ? { width: toCssSize(mergedSize.value) }
        : { height: toCssSize(mergedSize.value) };
      const distance = pushDistance.value;
      if (children.size && distance) {
        const negative = props.placement === 'right' || props.placement === 'bottom';
        const amount =
          typeof distance === 'number'
            ? `${negative ? -distance : distance}px`
            : negative
              ? `calc(-1 * ${distance})`
              : distance;
        style.transform = `translate${isHorizontal.value ? 'X' : 'Y'}(${amount})`;
      }
      return style;
    });
    const { dragElementProps, isDragging } = useDrag(() => ({
      enabled: props.open && !!props.resizable,
      prefixCls: `${props.prefixCls}-resizable`,
      direction: props.placement,
      className: props.classNames?.dragger,
      style: props.styles?.dragger,
      maxSize: props.maxSize,
      containerRef: wrapper,
      currentSize: mergedSize.value,
      onResize: (size) => {
        setCurrentSize(size);
        emit('resize', size);
      },
      onResizeStart: (size) => emit('resizeStart', size),
      onResizeEnd: (size) => emit('resizeEnd', size),
    }));
    const motion = computed(() =>
      typeof props.motion === 'function' ? props.motion(props.placement) : props.motion,
    );

    return () => {
      const prefix = props.prefixCls;
      const rootAttrs: Record<string, unknown> = {};
      const dialogAttrs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'id' || key === 'role' || key.startsWith('aria-')) dialogAttrs[key] = value;
        else rootAttrs[key] = value;
      }
      return h(
        'div',
        {
          ...rootAttrs,
          ref: panel,
          class: [
            prefix,
            `${prefix}-${props.placement}`,
            rootAttrs.class,
            { [`${prefix}-open`]: props.open, [`${prefix}-inline`]: props.inline },
          ],
          style: [
            rootAttrs.style,
            props.zIndex !== undefined ? { zIndex: props.zIndex } : undefined,
          ],
          tabindex: rootAttrs.tabindex ?? -1,
        },
        [
          h(
            CSSMotion,
            {
              motionName: `${prefix}-mask-motion`,
              motionDeadline: 500,
              ...props.maskMotion,
              visible: props.mask && props.open,
            },
            {
              default: (motionProps: CSSMotionSlotProps) =>
                h('div', {
                  class: [`${prefix}-mask`, motionProps.className, props.classNames?.mask],
                  style: [motionProps.style, props.styles?.mask],
                  onClick: props.maskClosable && props.open ? props.onClose : undefined,
                }),
            },
          ),
          h(
            CSSMotion,
            {
              motionName: `${prefix}-panel-motion-${props.placement}`,
              motionDeadline: 500,
              ...motion.value,
              visible: props.open,
              forceRender: props.forceRender,
              removeOnLeave: false,
              leavedClassName: `${prefix}-content-wrapper-hidden`,
              onVisibleChanged: (visible: boolean) => props.afterOpenChange?.(visible),
            },
            {
              default: (motionProps: CSSMotionSlotProps) =>
                h(
                  'div',
                  {
                    ref: wrapper,
                    class: [
                      `${prefix}-content-wrapper`,
                      props.classNames?.wrapper,
                      isDragging.value
                        ? `${prefix}-content-wrapper-dragging`
                        : motionProps.className,
                    ],
                    style: [motionProps.style, wrapperStyle.value, props.styles?.wrapper],
                  },
                  [
                    props.resizable ? h('div', dragElementProps.value) : null,
                    h(
                      DrawerSection,
                      {
                        ...dialogAttrs,
                        prefixCls: prefix,
                        class: props.classNames?.section,
                        style: props.styles?.section,
                      },
                      { default: () => slots.default?.() },
                    ),
                  ],
                ),
            },
          ),
        ],
      );
    };
  },
});
