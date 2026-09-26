/**
 * `DrawerPopup` —— `@rc-component/drawer@1.4.2` `es/DrawerPopup.js`（264 行）的 Vue 版。
 *
 * 渲染树（逐条对齐上游，L4 的判据）：
 *
 * ```
 * <div class="{p} {p}-{placement} [rootClassName] [{p}-open] [{p}-inline]"
 *      style={{...rootStyle, zIndex}} tabIndex={-1} ref={panelRef}>
 *   ├─ CSSMotion(mask, visible = mask && open)
 *   │    └─ <div class="{p}-mask [motion] [classNames.mask] [maskClassName]"
 *   │           style={{...motion, ...maskStyle, ...styles.mask}}
 *   │           onClick={maskClosable && open ? onClose : undefined} />
 *   └─ CSSMotion(panel, visible = open, removeOnLeave = false,
 *                leavedClassName = "{p}-content-wrapper-hidden")
 *        └─ <div ref={wrapperRef}
 *               class="{p}-content-wrapper [dragging] [classNames.wrapper] [motion]"
 *               style={{...motion, ...wrapperStyle, ...styles.wrapper}}>
 *             ├─ resizable && <div {...dragElementProps} />
 *             └─ <DrawerSection id class={className, classNames.section} ...>{children}</DrawerSection>
 * ```
 *
 * 关键判据：
 *   1. **尺寸轴**：`isHorizontal = left | right`；水平写 `wrapperStyle.width`、
 *      垂直写 `height`（都过 `parseWidthHeight`）；
 *   2. **push**：`push === true ⇒ {}`、`false ⇒ { distance: 0 }`；
 *      `pushDistance = push.distance ?? 父 context ?? 180`；
 *      被推时按方位 `translateY(±d)`（top 正 / bottom 负）、`translateX(±d)`（left 正 / right 负）；
 *   3. **父推挤链**：`open` 时 `parentContext.push()`、关闭或卸载时 `pull()`（嵌套 drawer 逐层推开）；
 *   4. **mask 点击关闭**的条件是 `maskClosable && open`（两个都要真）；
 *   5. `onFocus` 先过 `ignoreElement(e.target)`（焦点陷阱的「忽略外部」逻辑）；
 *   6. `pickAttrs` 分流：aria 给面板、data 给 wrapper。
 */
import { CSSMotion } from '@apollo-design/motion';
import { pickAttrs } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  onScopeDispose,
  type PropType,
  provide,
  ref,
  type VNodeChild,
  watch,
} from 'vue';

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

const clsx = (...args: Array<string | false | undefined | Record<string, unknown>>): string => {
  const out: string[] = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string') out.push(arg);
    else {
      for (const [key, value] of Object.entries(arg)) if (value) out.push(key);
    }
  }
  return out.join(' ');
};

export default defineComponent({
  name: 'ADrawerPopup',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    open: { type: Boolean, default: false },
    placement: {
      type: String as PropType<'top' | 'right' | 'bottom' | 'left'>,
      default: 'right',
    },
    inline: { type: Boolean, default: false },
    push: {
      type: [Boolean, Object] as PropType<boolean | { distance?: string | number }>,
      default: undefined,
    },
    forceRender: { type: Boolean, default: false },
    autoFocus: { type: Boolean, default: true },
    focusTrap: { type: Boolean, default: undefined },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    rootClassName: { type: String, default: undefined },
    rootStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    zIndex: { type: Number, default: undefined },
    className: { type: String, default: undefined },
    id: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    motion: {
      type: [Object, Function] as PropType<DrawerMotion | ((placement: string) => DrawerMotion)>,
      default: undefined,
    },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    height: { type: [String, Number] as PropType<string | number>, default: undefined },
    size: { type: [String, Number] as PropType<string | number>, default: undefined },
    maxSize: { type: Number, default: undefined },
    mask: { type: [Boolean, Object] as PropType<unknown>, default: true },
    maskClosable: { type: Boolean, default: true },
    maskMotion: { type: Object as PropType<DrawerMotion>, default: undefined },
    maskClassName: { type: String, default: undefined },
    maskStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    styles: {
      type: Object as PropType<Record<string, Record<string, unknown> | undefined>>,
      default: undefined,
    },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    onClose: { type: Function as PropType<(e: Event) => void>, default: undefined },
    drawerRender: {
      type: Function as PropType<(node: VNodeChild) => VNodeChild>,
      default: undefined,
    },
    resizable: { type: [Boolean, Object] as PropType<unknown>, default: undefined },
    defaultSize: { type: Number, default: undefined },
    onMouseEnter: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onMouseOver: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onMouseLeave: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onKeyDown: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
    onKeyUp: { type: Function as PropType<(e: KeyboardEvent) => void>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const panelRef = ref<HTMLElement | null>(null);
    const wrapperRef = ref<HTMLElement | null>(null);

    // ------------------------------ 焦点 ------------------------------
    const ignoreElement = useFocusable(
      () => panelRef.value,
      () => props.open,
      () => props.autoFocus,
      () => props.focusTrap,
      () => props.mask,
    );

    // ------------------------------ 推挤 ------------------------------
    const pushed = ref(false);
    const parentContext = inject(drawerContextKey, null);

    const pushDistance = computed(() => {
      const push = props.push;
      const config = typeof push === 'boolean' ? (push ? {} : { distance: 0 }) : (push ?? {});
      return (
        (config as { distance?: string | number }).distance ??
        parentContext?.value?.pushDistance ??
        180
      );
    });

    const mergedContext = computed<DrawerContextValue>(() => ({
      pushDistance: pushDistance.value,
      push: () => {
        pushed.value = true;
      },
      pull: () => {
        pushed.value = false;
      },
    }));
    provide(drawerContextKey, mergedContext);

    watch(
      () => props.open,
      (open) => {
        if (open) parentContext?.value?.push();
        else parentContext?.value?.pull();
      },
      { immediate: true },
    );
    onScopeDispose(() => {
      parentContext?.value?.pull();
    });

    // ------------------------------ 尺寸 ------------------------------
    const isHorizontal = computed(() => props.placement === 'left' || props.placement === 'right');
    const currentSize = ref<string | number | undefined>(undefined);

    /** `parseWidthHeight`：`'378px'` ⇒ 378（上游逐字；非法值原样返回）。 */
    const parseWidthHeight = (value?: string | number): string | number | undefined => {
      if (typeof value === 'string') {
        const num = Number(value.replace(/px$/i, ''));
        if (!Number.isNaN(num)) return num;
      }
      return value;
    };

    const mergedSize = computed(() =>
      parseWidthHeight(
        props.size ??
          (isHorizontal.value ? props.width : props.height) ??
          currentSize.value ??
          props.defaultSize ??
          (isHorizontal.value ? 378 : undefined),
      ),
    );

    const wrapperStyle = computed<Record<string, unknown>>(() => {
      const style: Record<string, unknown> = {};
      if (pushed.value && pushDistance.value) {
        const d = pushDistance.value;
        switch (props.placement) {
          case 'top':
            style.transform = `translateY(${d}px)`;
            break;
          case 'bottom':
            style.transform = `translateY(${-d}px)`;
            break;
          case 'left':
            style.transform = `translateX(${d}px)`;
            break;
          default:
            style.transform = `translateX(${-d}px)`;
        }
      }
      // ⚠️ **必须过 `toCssSize`**：Vue 的 patchStyle 不给数字补 px（React 才补），
      //    裸数字会被静默丢弃 ⇒ 面板宽度/高度全丢（PITFALLS 170 / D94 同源）。
      if (isHorizontal.value) style.width = toCssSize(parseWidthHeight(mergedSize.value));
      else style.height = toCssSize(parseWidthHeight(mergedSize.value));
      return style;
    });

    // ----------------------------- resizable -----------------------------
    const isResizable = computed(() => !!props.resizable);
    const resizeConfig = computed(
      () =>
        (typeof props.resizable === 'object' && props.resizable ? props.resizable : {}) as {
          onResize?: (size: number) => void;
          onResizeStart?: (size: number) => void;
          onResizeEnd?: (size: number) => void;
        },
    );

    const { dragElementProps, isDragging } = useDrag(() => ({
      prefixCls: `${props.prefixCls}-resizable`,
      direction: props.placement,
      className: props.classNames?.dragger,
      style: props.styles?.dragger,
      maxSize: props.maxSize,
      containerRef: wrapperRef,
      currentSize: mergedSize.value,
      onResize: (size: number) => {
        currentSize.value = size;
        resizeConfig.value.onResize?.(size);
      },
      onResizeStart: (size: number) => resizeConfig.value.onResizeStart?.(size),
      onResizeEnd: (size: number) => resizeConfig.value.onResizeEnd?.(size),
    }));

    // ------------------------------ 动效 ------------------------------
    const maskMotionProps = computed(() => ({
      motionName: props.maskMotion?.motionName ?? `${props.prefixCls}-mask-motion`,
      motionAppear: props.maskMotion?.motionAppear ?? true,
      motionEnter: props.maskMotion?.motionEnter ?? true,
      motionLeave: props.maskMotion?.motionLeave ?? true,
      motionDeadline: props.maskMotion?.motionDeadline ?? 500,
    }));

    const panelMotionProps = computed(() => {
      const motion =
        typeof props.motion === 'function' ? props.motion(props.placement) : props.motion;
      return {
        motionName: motion?.motionName ?? `${props.prefixCls}-panel-motion-${props.placement}`,
        motionAppear: motion?.motionAppear ?? true,
        motionEnter: motion?.motionEnter ?? true,
        motionLeave: motion?.motionLeave ?? true,
        motionDeadline: motion?.motionDeadline ?? 500,
      };
    });

    const eventHandlers = (): Record<string, unknown> => ({
      onMouseenter: props.onMouseEnter,
      onMouseover: props.onMouseOver,
      onMouseleave: props.onMouseLeave,
      onClick: props.onClick,
      onKeydown: props.onKeyDown,
      onKeyup: props.onKeyUp,
      onFocus: (e: FocusEvent) => {
        ignoreElement(e.target as HTMLElement);
      },
    });

    return () => {
      const prefixCls = props.prefixCls;
      const open = props.open;

      // >>> Mask
      const maskNode = h(
        CSSMotion,
        {
          ...maskMotionProps.value,
          visible: !!props.mask && open,
        },
        {
          default: (motion: { className?: string; style?: Record<string, unknown> }) =>
            h('div', {
              class: clsx(
                `${prefixCls}-mask`,
                motion.className,
                props.classNames?.mask,
                props.maskClassName,
              ),
              style: { ...motion.style, ...props.maskStyle, ...props.styles?.mask },
              onClick: props.maskClosable && open ? props.onClose : undefined,
            }),
        },
      );

      // >>> Panel
      const panelNode = h(
        CSSMotion,
        {
          ...panelMotionProps.value,
          visible: open,
          forceRender: props.forceRender,
          removeOnLeave: false,
          leavedClassName: `${prefixCls}-content-wrapper-hidden`,
          hooks: {
            onVisibleChanged: (visible: boolean) => props.afterOpenChange?.(visible),
          },
        },
        {
          default: (
            motion: { className?: string; style?: Record<string, unknown> },
            motionRef?: unknown,
          ) => {
            const content = h(
              DrawerSection,
              {
                id: props.id,
                containerRef: typeof motionRef === 'function' ? (motionRef as never) : undefined,
                prefixCls,
                className: clsx(props.className, props.classNames?.section),
                style: { ...props.style, ...props.styles?.section },
                ...pickAttrs(attrs as Record<string, unknown>, { aria: true }),
                ...eventHandlers(),
              },
              { default: () => slots.default?.() },
            );

            return h(
              'div',
              {
                ref: wrapperRef,
                class: clsx(
                  `${prefixCls}-content-wrapper`,
                  isDragging.value && `${prefixCls}-content-wrapper-dragging`,
                  props.classNames?.wrapper,
                  !isDragging.value && motion.className,
                ),
                style: { ...motion.style, ...wrapperStyle.value, ...props.styles?.wrapper },
                ...pickAttrs(attrs as Record<string, unknown>, { data: true }),
              },
              [
                isResizable.value ? h('div', dragElementProps as never) : null,
                props.drawerRender ? props.drawerRender(content) : content,
              ],
            );
          },
        },
      );

      return h(
        'div',
        {
          class: clsx(prefixCls, `${prefixCls}-${props.placement}`, props.rootClassName, {
            [`${prefixCls}-open`]: open,
            [`${prefixCls}-inline`]: props.inline,
          }),
          style: { ...props.rootStyle, ...(props.zIndex ? { zIndex: props.zIndex } : {}) },
          tabIndex: -1,
          ref: panelRef,
        },
        [maskNode, panelNode],
      );
    };
  },
});
