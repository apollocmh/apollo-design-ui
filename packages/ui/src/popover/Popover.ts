/**
 * Popover —— antd `components/popover/index.tsx`（192 行）的 Vue 版。
 *
 * 结构（analysis §1）：Tooltip 的薄包装 —— Trigger/portal/motion/开合协议全部
 * 复用 Tooltip 组件，只把内容通道换成 Overlay（`{p}-title` + `{p}-content`）。
 *
 * Popover 自己消费当前 Provider、组件 Token、内容和通知事件，Tooltip
 * 负责实际浮层生命周期与定位；注入标记避免消费 Tooltip 专属配置。
 */

import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  type PropType,
  type SlotsType,
  shallowRef,
} from 'vue';
import { clsx } from '../_internal/clsx';
import type { TriggerAlign } from '../_internal/trigger';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { TooltipPlacement, TooltipRef } from '../tooltip/interface';
import Tooltip, { provideTooltipInjection, tooltipInjectKey } from '../tooltip/Tooltip';
import { useMergedArrow } from '../tooltip/use-merged-arrow';
import type {
  PopoverClassNames,
  PopoverProps,
  PopoverSemanticType,
  PopoverSlots,
  PopoverStyles,
} from './interface';
import PurePanel from './PurePanel';
import { usePopoverTheme } from './use-popover-theme';

/** Popconfirm extends this overlay using the same, single-use owner channel. */
export { provideTooltipInjection as providePopoverInjection };

type StyleLike = Record<string, string | number>;

/** antd `isReactRenderable`：排除 null / undefined / boolean（`0` 合法）。 */
function isRenderable(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

type TooltipContentLike = PopoverProps['title'];

const Popover = defineComponent({
  name: 'APopover',
  inheritAttrs: false,
  slots: Object as SlotsType<PopoverSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    title: {
      type: [Object, String, Number, Boolean, Array] as PropType<TooltipContentLike>,
      default: undefined,
    },
    content: {
      type: [Object, String, Number, Boolean, Array] as PropType<TooltipContentLike>,
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
    destroyTooltipOnHide: {
      type: [Boolean, Object] as PropType<PopoverProps['destroyTooltipOnHide']>,
      default: undefined,
    },
    fresh: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    autoAdjustOverflow: {
      type: [Boolean, Object] as PropType<PopoverProps['autoAdjustOverflow']>,
      default: undefined,
    },
    classNames: {
      type: [Object, Function] as PropType<PopoverClassNames>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<PopoverStyles>, default: undefined },
    zIndex: { type: Number, default: undefined },
    // ⚠️ 以下是 `PopoverProps extends TooltipProps` 承诺、但本组件原先**没有声明**
    //    ⇒ 传进来会落进 attrs 又被 `inheritAttrs: false` 静默丢弃（Issue #25.1）。
    //    声明后统一显式下传给内部 Tooltip，不要指望 attrs 透传（那会打到触发器 DOM）。
    getPopupContainer: {
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    getTooltipContainer: {
      type: Function as PropType<(triggerNode: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    align: { type: Object as PropType<TriggerAlign>, default: undefined },
    builtinPlacements: {
      type: Object as PropType<Record<string, TriggerAlign>>,
      default: undefined,
    },
    openClassName: { type: String, default: undefined },
    overlayStyle: { type: Object as PropType<PopoverProps['overlayStyle']>, default: undefined },
    overlayInnerStyle: {
      type: Object as PropType<PopoverProps['overlayInnerStyle']>,
      default: undefined,
    },
    overlayClassName: { type: String, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
    openChange: (_open: boolean) => true,
    afterOpenChange: (_open: boolean) => true,
    popupClick: (_event: MouseEvent) => true,
  },
  setup(props, { slots, attrs, expose, emit }) {
    const inheritedOwner = inject(tooltipInjectKey, undefined);
    const popoverTheme = usePopoverTheme(() => !inheritedOwner);
    // ⚠️ antd 的 `data-popover-inject`：告诉下层 Tooltip「我是注入方」⇒ 跳过
    //    ConfigProvider `components.tooltip` 的专属配置（Issue #24.4）。
    provideTooltipInjection(
      inheritedOwner?.zIndexPopupBase ?? (() => popoverTheme.componentToken.value.zIndexPopup),
    );
    const context = useComponentConfig<{
      classNames?: PopoverClassNames;
      styles?: PopoverStyles;
      arrow?: boolean | { pointAtCenter?: boolean };
      trigger?: string | string[];
      mouseEnterDelay?: number;
      mouseLeaveDelay?: number;
      className?: string;
      style?: StyleLike;
    }>('popover');
    const ownedContext: Partial<typeof context> = inheritedOwner ? {} : context;

    const prefixCls = computed(() => props.prefixCls ?? context.getPrefixCls('popover'));

    // ============================ Merge ==============================
    const mergedMouseEnterDelay = computed(
      () => props.mouseEnterDelay ?? ownedContext.mouseEnterDelay ?? 0.1,
    );
    const mergedMouseLeaveDelay = computed(
      () => props.mouseLeaveDelay ?? ownedContext.mouseLeaveDelay ?? 0.1,
    );
    const mergedArrow = useMergedArrow(
      () => props.arrow,
      () => ownedContext.arrow,
    );
    const mergedTrigger = computed(() => props.trigger || ownedContext.trigger || 'hover');

    // ============================= Open ==============================
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        emit('openChange', next);
        emit('update:open', next);
      },
    });
    const settingOpen = (nextOpen: boolean): void => {
      setOpen(nextOpen);
    };

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
      [() => ownedContext.classNames, () => props.classNames],
      [
        () => ownedContext.styles,
        () => (ownedContext.style ? { root: ownedContext.style } : undefined),
        () => props.styles,
      ],
      // ⚠️ 传 **computed 本身**（不是 `.value`）：函数式变体每次重算都要看到当前
      //    props；传 setup 期快照会让后续 props 变化在函数式里不可见（Issue #26.3）。
      mergedProps,
    );

    // Tooltip routes native class/style to the popup root. Other native attrs
    // keep its existing trigger-element target.
    const rootClassNames = computed(() =>
      clsx(ownedContext.className, mergedClassNames.value.root),
    );
    const rootStyles = computed<StyleLike>(() => ({
      ...popoverTheme.style.value,
      ...mergedStyles.value.root,
    }));

    // ============================ Overlay ============================
    // antd：title/content 双双不可渲染 ⇒ overlay=null ⇒ Tooltip 的 noTitle 生效。
    const renderOverlay = () => {
      const title = slots.title ? slots.title() : props.title;
      const content = slots.content ? slots.content() : props.content;
      if (!isRenderable(title) && !isRenderable(content)) return null;
      // ⚠️ antd 的 Overlay 是 **Fragment** ⇒ `-container` 的直接子元素就是
      //    title / content；包一层 div 会破坏 `container > .title` 这类规则
      //    （flex/grid 布局也会多一层）—— Issue #25.5。
      return h(Fragment, [
        isRenderable(title)
          ? h(
              'div',
              {
                key: 'title',
                class: [`${prefixCls.value}-title`, mergedClassNames.value.title],
                style: mergedStyles.value.title,
              },
              [title],
            )
          : null,
        isRenderable(content)
          ? h(
              'div',
              {
                key: 'content',
                class: [`${prefixCls.value}-content`, mergedClassNames.value.content],
                style: mergedStyles.value.content,
              },
              [content],
            )
          : null,
      ]);
    };

    // ============================ Expose =============================
    const tooltipRef = shallowRef<TooltipRef | null>(null);
    expose({
      forceAlign: () => tooltipRef.value?.forceAlign(),
      nativeElement: computed(() => tooltipRef.value?.nativeElement ?? null),
      popupElement: computed(() => tooltipRef.value?.popupElement ?? null),
    });

    return () => {
      const overlay = renderOverlay();
      const children = slots.default?.();
      return h(
        Tooltip,
        {
          ...attrs,
          ref: tooltipRef,
          prefixCls: prefixCls.value,
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
          destroyTooltipOnHide: props.destroyTooltipOnHide,
          fresh: props.fresh,
          forceRender: props.forceRender,
          // 语义：Popover 的 root 合并了 overlayClassName/contextClassName 之外
          // 还带 title/content 两槽 —— root/container/arrow 传给 Tooltip，
          // title/content 由 Overlay 消费。
          classNames: {
            root: rootClassNames.value,
            container: mergedClassNames.value.container,
            arrow: mergedClassNames.value.arrow,
          },
          styles: {
            root: rootStyles.value,
            container: mergedStyles.value.container,
            arrow: mergedStyles.value.arrow,
          },
          overlayClassName: props.overlayClassName,
          overlayStyle: props.overlayStyle,
          overlayInnerStyle: props.overlayInnerStyle,
          // 以下是 `PopoverProps extends TooltipProps` 的公共配置（Issue #25.1）。
          getPopupContainer: props.getPopupContainer,
          getTooltipContainer: props.getTooltipContainer,
          align: props.align,
          builtinPlacements: props.builtinPlacements,
          onPopupClick: (event: MouseEvent) => emit('popupClick', event),
          openClassName: props.openClassName,
          open: mergedOpen.value,
          onOpenChange: settingOpen,
          onAfterOpenChange: (open: boolean) => emit('afterOpenChange', open),
          motion: {
            // antd：getTransitionName(rootPrefixCls, 'zoom-big')（非 fast）
            motionName: props.motion?.motionName ?? 'apollo-zoom-big',
          },
        },
        // C8-R2：Tooltip 的内容通道只剩 `#title` 插槽 —— Popover 的 overlay
        // （title/content 双槽结构）整体经它下发。
        { default: () => children, title: () => overlay },
      );
    };
  },
});

// `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板挂载
Popover._InternalPanelDoNotUseOrYouWillBeFired = PurePanel as never;

export default Popover;
