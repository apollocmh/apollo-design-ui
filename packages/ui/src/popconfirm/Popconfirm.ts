/**
 * Popconfirm —— 气泡确认框。
 *
 * 契约来源：antd 6.6.4 `es/popconfirm/index.js`（薄壳，208 行）。
 *
 * 结构：**Popover 的薄包装** —— 开合 / portal / motion / trigger 协议全部复用
 * `Popover`，只把 content 通道换成 `Overlay`（`-inner-content` 那棵确认树）。
 *
 * ── 六条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **默认参数与 Popover 不同**：`placement` 默认 `top`；`trigger` 默认 `click`
 *    （Popover 是 `hover`）；`okType` 默认 `primary`；`icon` 默认
 *    `ExclamationCircleFilled`；`showCancel` 默认 true。
 * 2. **`disabled` 时不打开**：`onInternalOpenChange` 里 `if (disabled) return`
 *    —— 注意它在 `settingOpen` **之前**拦截，所以连 `onOpenChange` 都不发。
 * 3. **`onConfirm` 之后关闭**：ActionButton 的 `quitOnNullishReturnValue` +
 *    `emitEvent` 保证「同步返回值 ⇒ 立刻 close」；返回 Promise 时
 *    等 resolve 才 close（判据见 `_internal/action-button.ts`）。
 * 4. **`onCancel` 先关后回调**：`settingOpen(false)` 在前，`props.onCancel` 在后。
 * 5. **`title` 以 props 形态传给 Overlay，不传给 Popover**
 *    —— 否则 Popover 会把它当自己的 title 通道渲染一遍。
 * 6. **语义槽**：Popover 的 root/container/arrow 走 Popover 的 classNames/styles；
 *    icon/title/content 走 Overlay 的（且 description 用 `content` 槽）。
 */

import { useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import type { TriggerAlign } from '../_internal/trigger';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { PopoverRef } from '../popover/interface';
import Popover, { providePopoverInjection } from '../popover/Popover';
import { useMergedArrow } from '../tooltip/use-merged-arrow';
import type {
  PopconfirmClassNames,
  PopconfirmProps,
  PopconfirmSemanticType,
  PopconfirmSlots,
  PopconfirmStyles,
} from './interface';
import { Overlay } from './PurePanel';
import { usePopconfirmTheme } from './use-popconfirm-theme';

const Popconfirm = defineComponent({
  name: 'APopconfirm',
  inheritAttrs: false,
  slots: Object as SlotsType<PopconfirmSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    title: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopconfirmProps['title']>,
      default: undefined,
    },
    description: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopconfirmProps['description']>,
      default: undefined,
    },
    disabled: { type: Boolean, default: false },
    okText: { type: String, default: undefined },
    okType: { type: String as PropType<PopconfirmProps['okType']>, default: 'primary' },
    cancelText: { type: String, default: undefined },
    okButtonProps: {
      type: Object as PropType<PopconfirmProps['okButtonProps']>,
      default: undefined,
    },
    cancelButtonProps: {
      type: Object as PropType<PopconfirmProps['cancelButtonProps']>,
      default: undefined,
    },
    showCancel: { type: Boolean, default: true },
    icon: {
      type: [Object, String, Boolean] as PropType<PopconfirmProps['icon']>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    trigger: { type: [String, Array] as PropType<string | string[]>, default: undefined },
    placement: { type: String as PropType<PopconfirmProps['placement']>, default: 'top' },
    arrow: {
      type: [Boolean, Object] as PropType<boolean | { pointAtCenter?: boolean }>,
      default: undefined,
    },
    mouseEnterDelay: { type: Number, default: undefined },
    mouseLeaveDelay: { type: Number, default: undefined },
    overlayClassName: { type: String, default: undefined },
    overlayStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    classNames: { type: [Object, Function] as PropType<PopconfirmClassNames>, default: undefined },
    styles: { type: [Object, Function] as PropType<PopconfirmStyles>, default: undefined },
    // ⚠️ 以下来自 antd `AbstractTooltipProps`（Issue #26.1）：原先**没声明** ⇒ 落进
    //    attrs 后被 `...restProps` 塞给 Popover，能否生效全看 Popover 有没有声明
    //    （而且 `onPopupClick` 因此被**传了两份** ⇒ 一次点击回调两次）。
    getPopupContainer: {
      type: Function as PropType<PopconfirmProps['getPopupContainer']>,
      default: undefined,
    },
    getTooltipContainer: {
      type: Function as PropType<PopconfirmProps['getTooltipContainer']>,
      default: undefined,
    },
    align: { type: Object as PropType<TriggerAlign>, default: undefined },
    builtinPlacements: {
      type: Object as PropType<Record<string, TriggerAlign>>,
      default: undefined,
    },
    zIndex: { type: Number, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    fresh: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    id: { type: String, default: undefined },
    onConfirm: { type: Function as PropType<PopconfirmProps['onConfirm']>, default: undefined },
    onCancel: { type: Function as PropType<PopconfirmProps['onCancel']>, default: undefined },
  },
  /** Owned notifications use emits; asynchronous business callbacks remain props. */
  emits: {
    'update:open': (_open: boolean) => true,
    openChange: (_open: boolean) => true,
    afterOpenChange: (_open: boolean) => true,
    popupClick: (_event: MouseEvent) => true,
  },
  setup(props, { attrs, emit, expose, slots }) {
    const context = useComponentConfig<{
      classNames?: PopconfirmProps['classNames'];
      styles?: PopconfirmProps['styles'];
      arrow?: boolean | { pointAtCenter?: boolean };
      trigger?: string | string[];
      mouseEnterDelay?: number;
      mouseLeaveDelay?: number;
      className?: string;
      style?: CSSProperties;
    }>('popconfirm');
    const popconfirmTheme = usePopconfirmTheme();
    providePopoverInjection(() => popconfirmTheme.componentToken.value.zIndexPopup);

    const prefixCls = computed(() => context.getPrefixCls('popconfirm', props.prefixCls));

    // ============================ Merge ==============================
    const mergedArrow = useMergedArrow(
      () => props.arrow,
      () => context.arrow,
    );
    const mergedTrigger = computed(() => props.trigger || context.trigger || 'click');
    const mergedMouseEnterDelay = computed(
      () => props.mouseEnterDelay ?? context.mouseEnterDelay ?? 0.1,
    );
    const mergedMouseLeaveDelay = computed(
      () => props.mouseLeaveDelay ?? context.mouseLeaveDelay ?? 0.1,
    );

    // ============================= Open ==============================
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        emit('openChange', next);
        emit('update:open', next);
      },
    });
    // A refused controlled close keeps the current operation. Accepted hiding
    // starts a new button session without replacing the confirmation body.
    const confirmSession = shallowRef(0);
    watch(mergedOpen, () => confirmSession.value++, { flush: 'sync' });
    const settingOpen = (nextOpen: boolean): void => {
      setOpen(nextOpen);
    };
    const close = (): void => {
      settingOpen(false);
    };

    /**
     * ⚠️ 必须**隐式返回** actionFn 的返回值 —— 上游 `onConfirm = (e) =>
     *    props.onConfirm?.call(this, e)` 是单行箭头（返回表达式值）。写成
     *    `{ …; }` 会吞掉返回值，ActionButton 的 Promise 链就断了
     *    （Promise 用例会表现为「点 OK 立刻关闭」）。
     */
    const onConfirm = (e?: MouseEvent): unknown => props.onConfirm?.(e);
    // 判据 4：先关，再回调
    const onCancel = (e?: MouseEvent): void => {
      settingOpen(false);
      props.onCancel?.(e);
    };
    // 判据 2：disabled 时连 onOpenChange 都不发
    const onInternalOpenChange = (nextOpen: boolean): void => {
      if (props.disabled) return;
      settingOpen(nextOpen);
    };

    // ========================== Semantic =============================
    const mergedProps = computed<PopconfirmProps>(() => ({
      ...props,
      placement: props.placement ?? 'top',
      trigger: mergedTrigger.value,
      okType: props.okType,
      mouseEnterDelay: mergedMouseEnterDelay.value,
      mouseLeaveDelay: mergedMouseLeaveDelay.value,
    }));

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      PopconfirmProps,
      NonNullable<PopconfirmSemanticType['classNames']>,
      NonNullable<PopconfirmSemanticType['styles']>
    >(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => (context.style ? { root: context.style } : undefined),
        () => props.styles,
        // antd：overlayStyleRoot = useSemanticRootStyle(overlayStyle) 排在最后
        () => (props.overlayStyle ? { root: props.overlayStyle } : undefined),
      ],
      // ⚠️ 传 **computed 本身**（不是 `.value`）：函数式变体每次重算都要看到当前
      //    props，传 setup 期快照会让 `open` 变化后函数式仍按旧值算（Issue #26.3）。
      mergedProps,
    );

    const rootClassNames = computed(() =>
      [prefixCls.value, context.className, props.overlayClassName, mergedClassNames.value.root]
        .filter(Boolean)
        .join(' '),
    );
    const rootStyles = computed<CSSProperties>(() => ({
      ...popconfirmTheme.style.value,
      ...mergedStyles.value.root,
    }));

    // ============================ Expose =============================
    const popoverRef = shallowRef<PopoverRef | null>(null);
    const publicApi = {
      forceAlign: () => popoverRef.value?.forceAlign(),
      nativeElement: computed(() => popoverRef.value?.nativeElement ?? null),
      popupElement: computed(() => popoverRef.value?.popupElement ?? null),
    };
    expose(publicApi);

    const renderPopconfirm = () => {
      const p = prefixCls.value;
      const session = confirmSession.value;
      return h(
        Popover,
        {
          ...attrs,
          ref: popoverRef,
          arrow: mergedArrow.value,
          trigger: mergedTrigger.value,
          placement: props.placement ?? 'top',
          onOpenChange: onInternalOpenChange,
          onAfterOpenChange: (open: boolean) => emit('afterOpenChange', open),
          open: mergedOpen.value,
          mouseEnterDelay: mergedMouseEnterDelay.value,
          mouseLeaveDelay: mergedMouseLeaveDelay.value,
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
          // Issue #26.1：公开类型承诺的公共浮层配置显式下传（不再靠 attrs 逃逸）
          getPopupContainer: props.getPopupContainer,
          getTooltipContainer: props.getTooltipContainer,
          align: props.align,
          builtinPlacements: props.builtinPlacements,
          zIndex: props.zIndex,
          destroyOnHidden: props.destroyOnHidden,
          fresh: props.fresh,
          forceRender: props.forceRender,
          id: props.id,
          content: h(
            Overlay,
            {
              prefixCls: p,
              icon: props.icon,
              okType: props.okType,
              okButtonProps: props.okButtonProps,
              cancelButtonProps: props.cancelButtonProps,
              cancelText: props.cancelText,
              okText: props.okText,
              showCancel: props.showCancel,
              title: props.title,
              description: props.description,
              onPopupClick: (event: MouseEvent) => emit('popupClick', event),
              confirmSession: session,
              close: () => {
                if (session === confirmSession.value) close();
              },
              onConfirm,
              onCancel,
              classNames: mergedClassNames.value,
              styles: mergedStyles.value,
            },
            // ⚠️ C8：富内容走**插槽**（`#okText` / `#cancelText` / `#title` /
            //    `#description`）—— Overlay 内部是「slot 优先」（Issue #26.4）。
            {
              icon: slots.icon ? () => slots.icon?.() : undefined,
              title: slots.title ? () => slots.title?.() : undefined,
              description: slots.description ? () => slots.description?.() : undefined,
              okText: slots.okText ? () => slots.okText?.() : undefined,
              cancelText: slots.cancelText ? () => slots.cancelText?.() : undefined,
            },
          ),
        },
        { default: () => slots.default?.() },
      );
    };
    return { ...publicApi, renderPopconfirm };
  },
  render() {
    return this.renderPopconfirm();
  },
});

export default Popconfirm;
