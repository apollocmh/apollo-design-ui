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
 *    `emitEvent` 保证「同步返回 falsy/nullish ⇒ 立刻 close」；返回 Promise 时
 *    等 resolve 才 close（判据见 `_internal/action-button.ts`）。
 * 4. **`onCancel` 先关后回调**：`settingOpen(false)` 在前，`props.onCancel` 在后。
 * 5. **`title` 以 props 形态传给 Overlay，不传给 Popover**：`omit(restProps, ['title'])`
 *    —— 否则 Popover 会把它当自己的 title 通道渲染一遍。
 * 6. **语义槽**：Popover 的 root/container/arrow 走 Popover 的 classNames/styles；
 *    icon/title/content 走 Overlay 的（且 description 用 `content` 槽）。
 */

import { ExclamationCircleFilled } from '@apollo-design/icons';
import { omit, useControlledValue } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, shallowRef, type VNodeChild } from 'vue';

import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import type { PopoverRef } from '../popover/interface';
import Popover from '../popover/Popover';
import { useMergedArrow } from '../tooltip/use-merged-arrow';
import type {
  PopconfirmClassNames,
  PopconfirmProps,
  PopconfirmSemanticType,
  PopconfirmStyles,
} from './interface';
import { Overlay } from './PurePanel';

type StyleLike = Record<string, string | number>;

const Popconfirm = defineComponent({
  name: 'APopconfirm',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    title: {
      type: [Object, String, Number, Function] as PropType<PopconfirmProps['title']>,
      default: undefined,
    },
    description: {
      type: [Object, String, Number, Function] as PropType<PopconfirmProps['description']>,
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
    overlayStyle: { type: Object as PropType<StyleLike>, default: undefined },
    classNames: { type: [Object, Function] as PropType<PopconfirmClassNames>, default: undefined },
    styles: { type: [Object, Function] as PropType<PopconfirmStyles>, default: undefined },
  },
  /** 只声明 `update:open`（供 `v-model:open`）；回调类一律走 attrs（PITFALLS 35）。 */
  emits: ['update:open'],
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as Pick<
      PopconfirmProps,
      'onOpenChange' | 'onConfirm' | 'onCancel' | 'onPopupClick'
    >;

    const context = useComponentConfig('popconfirm');
    const { getPrefixCls } = context;
    const contextSemantic = context as {
      classNames?: PopconfirmProps['classNames'];
      styles?: PopconfirmProps['styles'];
      arrow?: boolean | { pointAtCenter?: boolean };
      trigger?: string | string[];
      mouseEnterDelay?: number;
      mouseLeaveDelay?: number;
      className?: string;
      style?: StyleLike;
    };

    const prefixCls = computed(() => getPrefixCls('popconfirm', props.prefixCls));

    // ============================ Merge ==============================
    const mergedArrow = useMergedArrow(
      () => props.arrow,
      () => contextSemantic.arrow,
    );
    const mergedTrigger = computed(() => props.trigger || contextSemantic.trigger || 'click');
    const mergedMouseEnterDelay = computed(
      () => props.mouseEnterDelay ?? contextSemantic.mouseEnterDelay ?? 0.1,
    );
    const mergedMouseLeaveDelay = computed(
      () => props.mouseLeaveDelay ?? contextSemantic.mouseLeaveDelay ?? 0.1,
    );

    // ============================= Open ==============================
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        callbacks.onOpenChange?.(next);
        emit('update:open', next);
      },
    });
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
    const onConfirm = (e?: MouseEvent): unknown => callbacks.onConfirm?.(e);
    // 判据 4：先关，再回调
    const onCancel = (e?: MouseEvent): void => {
      settingOpen(false);
      callbacks.onCancel?.(e);
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
      [
        () => contextSemantic.classNames as PopconfirmSemanticType['classNames'] | undefined,
        () => props.classNames as PopconfirmSemanticType['classNames'] | undefined,
      ],
      [
        () => contextSemantic.styles as PopconfirmSemanticType['styles'] | undefined,
        () => (contextSemantic.style ? { root: contextSemantic.style } : undefined),
        () => props.styles as PopconfirmSemanticType['styles'] | undefined,
        // antd：overlayStyleRoot = useSemanticRootStyle(overlayStyle) 排在最后
        () => (props.overlayStyle ? { root: props.overlayStyle } : undefined),
      ],
      mergedProps.value,
    );

    const rootClassNames = computed(() =>
      [
        prefixCls.value,
        contextSemantic.className,
        props.overlayClassName,
        (mergedClassNames.value as unknown as { root?: string }).root,
      ]
        .filter(Boolean)
        .join(' '),
    );

    // ============================ Expose =============================
    const popoverRef = shallowRef<PopoverRef | null>(null);
    expose({
      forceAlign: () => popoverRef.value?.forceAlign(),
      nativeElement: computed(() => popoverRef.value?.nativeElement ?? null),
      popupElement: computed(() => popoverRef.value?.popupElement ?? null),
    });

    return () => {
      const p = prefixCls.value;
      // 判据 5：title 不进 Popover 的 restProps
      const restProps = omit(attrs as Record<string, unknown>, ['title']);

      return h(
        Popover,
        {
          ...restProps,
          ref: popoverRef as never,
          arrow: mergedArrow.value,
          trigger: mergedTrigger.value,
          placement: props.placement ?? 'top',
          onOpenChange: onInternalOpenChange,
          open: mergedOpen.value,
          mouseEnterDelay: mergedMouseEnterDelay.value,
          mouseLeaveDelay: mergedMouseLeaveDelay.value,
          classNames: {
            root: rootClassNames.value,
            container: mergedClassNames.value.container,
            arrow: mergedClassNames.value.arrow,
          },
          styles: {
            root: mergedStyles.value.root,
            container: mergedStyles.value.container,
            arrow: mergedStyles.value.arrow,
          },
          content: h(Overlay, {
            prefixCls: p,
            icon: props.icon === undefined ? h(ExclamationCircleFilled) : props.icon,
            okType: props.okType,
            okButtonProps: props.okButtonProps,
            cancelButtonProps: props.cancelButtonProps,
            cancelText: props.cancelText,
            okText: props.okText,
            showCancel: props.showCancel,
            title: props.title,
            description: props.description,
            onPopupClick: callbacks.onPopupClick,
            close,
            onConfirm,
            onCancel,
            classNames: mergedClassNames.value as never,
            styles: mergedStyles.value as never,
          }),
        } as never,
        { default: () => slots.default?.() as VNodeChild },
      );
    };
  },
});

export default Popconfirm;
