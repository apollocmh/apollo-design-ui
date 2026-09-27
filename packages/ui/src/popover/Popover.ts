/**
 * Popover —— antd `components/popover/index.tsx`（192 行）的 Vue 版。
 *
 * 结构（analysis §1）：Tooltip 的薄包装 —— Trigger/portal/motion/开合协议全部
 * 复用 Tooltip 组件，只把内容通道换成 Overlay（`{p}-title` + `{p}-content`）。
 *
 * 与 antd 的差异（COMPATIBILITY §9.2 D83–D85）：
 * - ConfigProvider.popover 不消费（D29 同判：UniqueProvider 未实现）；
 *   `useComponentConfig('popover')` 走 `components` 逃生口。
 * - wireframe 主题态不支持（D84）。
 * - `data-popover-inject` attr 不渲染（D85，React 注入标记）。
 * - onOpenChange 第二参数告警不移植（Vue 回调本就单参，无 usage 语义）。
 */

import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { TooltipPlacement, TooltipRef } from '../tooltip/interface';
import Tooltip from '../tooltip/Tooltip';
import { useMergedArrow } from '../tooltip/use-merged-arrow';
import type {
  PopoverClassNames,
  PopoverProps,
  PopoverSemanticType,
  PopoverStyles,
} from './interface';
import PurePanel from './PurePanel';

type StyleLike = Record<string, string | number>;

/** antd `isReactRenderable`：排除 null / undefined / boolean（`0` 合法）。 */
function isRenderable(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

/** 惰性求值（antd `getRenderPropValue`）。 */
function getRenderPropValue(value: TooltipContentLike): VNodeChild {
  return typeof value === 'function' ? (value as () => VNodeChild)() : (value as VNodeChild);
}

type TooltipContentLike = PopoverProps['title'];

const Popover = defineComponent({
  name: 'APopover',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    afterOpenChange: {
      type: Function as PropType<(open: boolean) => void>,
      default: undefined,
    },
    title: {
      type: [Object, String, Number, Function] as PropType<TooltipContentLike>,
      default: undefined,
    },
    content: {
      type: [Object, String, Number, Function] as PropType<TooltipContentLike>,
      default: undefined,
    },
    trigger: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    placement: { type: String as PropType<TooltipPlacement>, default: 'top' },
    arrow: {
      type: [Boolean, Object] as PropType<boolean | { pointAtCenter?: boolean }>,
      default: undefined,
    },
    color: { type: String, default: undefined },
    mouseEnterDelay: { type: Number, default: undefined },
    mouseLeaveDelay: { type: Number, default: undefined },
    motion: { type: Object as PropType<{ motionName?: string }>, default: undefined },
    id: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    fresh: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    autoAdjustOverflow: {
      type: [Boolean, Object] as PropType<boolean | { adjustX?: boolean; adjustY?: boolean }>,
      default: undefined,
    },
    classNames: {
      type: [Object, Function] as PropType<PopoverClassNames>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<PopoverStyles>, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<StyleLike>, default: undefined },
    zIndex: { type: Number, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
  },
  setup(props, { slots, attrs, expose, emit }) {
    const context = useComponentConfig('popover');
    const contextSemantic = context as {
      classNames?: PopoverSemanticType['classNames'];
      styles?: PopoverSemanticType['styles'];
      arrow?: boolean | { pointAtCenter?: boolean };
      trigger?: string | string[];
      mouseEnterDelay?: number;
      mouseLeaveDelay?: number;
      className?: string;
      style?: StyleLike;
    };

    const prefixCls = props.prefixCls ?? context.getPrefixCls('popover');

    // ============================ Merge ==============================
    const mergedMouseEnterDelay = computed(
      () => props.mouseEnterDelay ?? contextSemantic.mouseEnterDelay ?? 0.1,
    );
    const mergedMouseLeaveDelay = computed(
      () => props.mouseLeaveDelay ?? contextSemantic.mouseLeaveDelay ?? 0.1,
    );
    const mergedArrow = useMergedArrow(
      () => props.arrow,
      () => contextSemantic.arrow,
    );
    const mergedTrigger = computed(() => props.trigger || contextSemantic.trigger || 'hover');

    // ============================= Open ==============================
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        props.onOpenChange?.(next);
        emit('update:open', next);
      },
    });
    const settingOpen = (nextOpen: boolean): void => {
      setOpen(nextOpen);
    };

    // ============================ Content ============================
    const titleNode = computed(() =>
      props.title === undefined && slots.title ? slots.title() : getRenderPropValue(props.title),
    );
    const contentNode = computed(() =>
      props.content === undefined && slots.content
        ? slots.content()
        : getRenderPropValue(props.content),
    );

    // ======================== Merged Semantic ========================
    const mergedProps = computed<PopoverProps>(() => ({
      ...props,
      placement: props.placement ?? 'top',
      trigger: mergedTrigger.value,
      mouseEnterDelay: mergedMouseEnterDelay.value,
      mouseLeaveDelay: mergedMouseLeaveDelay.value,
    }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      PopoverProps,
      NonNullable<PopoverSemanticType['classNames']>,
      NonNullable<PopoverSemanticType['styles']>
    >(
      [
        () => contextSemantic.classNames,
        () => props.classNames as PopoverSemanticType['classNames'] | undefined,
      ],
      [
        () => contextSemantic.styles,
        () => (contextSemantic.style ? { root: contextSemantic.style } : undefined),
        () => props.styles as PopoverSemanticType['styles'] | undefined,
      ],
      mergedProps.value,
    );

    const rootClassNames = computed(() =>
      props.rootClassName
        ? `${props.rootClassName} ${mergedClassNames.value.root ?? ''}`.trim()
        : mergedClassNames.value.root,
    );

    // ============================ Overlay ============================
    // antd：title/content 双双不可渲染 ⇒ overlay=null ⇒ Tooltip 的 noTitle 生效。
    const overlay = computed<VNode | null>(() => {
      const title = titleNode.value;
      const content = contentNode.value;
      if (!isRenderable(title) && !isRenderable(content)) return null;
      return h('div', [
        isRenderable(title)
          ? h(
              'div',
              {
                class: [`${prefixCls}-title`, mergedClassNames.value.title] as unknown as Record<
                  string,
                  unknown
                >,
                style: mergedStyles.value.title as StyleLike | undefined,
              },
              [title as VNodeChild].filter((c) => c !== null && c !== undefined),
            )
          : null,
        isRenderable(content)
          ? h(
              'div',
              {
                class: [
                  `${prefixCls}-content`,
                  mergedClassNames.value.content,
                ] as unknown as Record<string, unknown>,
                style: mergedStyles.value.content as StyleLike | undefined,
              },
              [content as VNodeChild].filter((c) => c !== null && c !== undefined),
            )
          : null,
      ]);
    });

    // ============================ Expose =============================
    const tooltipRef = shallowRef<TooltipRef | null>(null);
    expose({
      forceAlign: () => tooltipRef.value?.forceAlign(),
      nativeElement: computed(() => tooltipRef.value?.nativeElement ?? null),
      popupElement: computed(() => tooltipRef.value?.popupElement ?? null),
    });

    return () => {
      const children = slots.default?.();
      return h(
        Tooltip,
        {
          ref: tooltipRef as never,
          prefixCls,
          arrow: mergedArrow.value.show ? mergedArrow.value : false,
          placement: props.placement ?? 'top',
          trigger: mergedTrigger.value,
          mouseEnterDelay: mergedMouseEnterDelay.value,
          mouseLeaveDelay: mergedMouseLeaveDelay.value,
          color: props.color,
          id: props.id,
          disabled: props.disabled,
          zIndex: props.zIndex,
          autoAdjustOverflow: props.autoAdjustOverflow,
          destroyOnHidden: props.destroyOnHidden,
          fresh: props.fresh,
          forceRender: props.forceRender,
          rootClassName: props.rootClassName,
          // 语义：Popover 的 root 合并了 overlayClassName/contextClassName 之外
          // 还带 title/content 两槽 —— root/container/arrow 传给 Tooltip，
          // title/content 由 Overlay 消费。
          classNames: {
            root: rootClassNames.value,
            container: mergedClassNames.value.container,
            arrow: mergedClassNames.value.arrow,
          } as PopoverSemanticType['classNames'],
          styles: {
            root: mergedStyles.value.root,
            container: mergedStyles.value.container,
            arrow: mergedStyles.value.arrow,
          } as PopoverSemanticType['styles'],
          className: props.className,
          style: props.style as StyleLike | undefined,
          open: mergedOpen.value,
          onOpenChange: settingOpen,
          afterOpenChange: props.afterOpenChange,
          motion: {
            // antd：getTransitionName(rootPrefixCls, 'zoom-big')（非 fast）
            motionName: props.motion?.motionName ?? 'apollo-zoom-big',
          },
        },
        // C8-R2：Tooltip 的内容通道只剩 `#title` 插槽 —— Popover 的 overlay
        // （title/content 双槽结构）整体经它下发。
        { default: () => children, title: () => overlay.value },
      );
    };
  },
});

// `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板挂载
Popover._InternalPanelDoNotUseOrYouWillBeFired = PurePanel as never;

export default Popover;
