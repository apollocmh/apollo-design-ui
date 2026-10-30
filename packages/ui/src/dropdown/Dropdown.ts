/**
 * Dropdown —— antd `components/dropdown/dropdown.tsx`（404 行）的 Vue 版。
 *
 * 结构：Trigger（`_internal/trigger.ts`，第 4 个消费者）之上薄薄一层：
 * - overlay = Menu + OverrideProvider 覆盖（prefixCls/mode/selectable/onClick/
 *   expandIcon —— 经 `menu/menuOverrideKey` 注入通道实现）；
 * - popup 内容之外无额外 DOM（rc-dropdown 的 popup 即 overlay 本体）；
 * - placement 归一（Center 剥离）+ transitionName 按方向推 slide-*；
 * - onMenuClick：非（selectable&&multiple）时关闭（source='menu'）。
 *
 * 已知差异（COMPATIBILITY §9.2 D91-）：trigger 数组收窄为 3 值、语义槽函数式
 * 形态 PENDING（D36 同判）、zIndexContext Provider 不做（useZIndex 已含层叠）。
 */

import { LeftOutlined, RightOutlined } from '@apollo-design/icons';
import { useZIndex } from '@apollo-design/portal';
import { getPlacements } from '@apollo-design/position';
import { useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  provide,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  type VNode as VNodeLike,
} from 'vue';
import { Trigger, type TriggerAlign } from '../_internal/trigger';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { menuOverrideKey } from '../menu/context';
import Menu from '../menu/Menu';
import type { DropdownPopupPlacement, DropdownProps, DropdownTriggerAction } from './interface';
import { dropdownTokenValues } from './style/token';

const DEPRECATIONS: Array<[keyof DropdownProps, string]> = [
  ['destroyPopupOnHide', 'destroyOnHidden'],
  ['overlayClassName', 'classNames.root'],
  ['overlayStyle', 'styles.root'],
];

type StyleLike = CSSProperties;

/** OverrideProvider 的 Vue 对应物（provide 必须在 setup 顶层 ⇒ 独立组件）。 */
const OverlayProvider = defineComponent({
  name: 'ADropdownOverlayProvider',
  props: {
    override: { type: Object as PropType<Record<string, unknown>>, required: true },
  },
  setup(props, { slots }) {
    provide(menuOverrideKey, props.override as never);
    return () => slots.default?.();
  },
});

const Dropdown = defineComponent({
  name: 'ADropdown',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    trigger: { type: Array as PropType<DropdownTriggerAction[]>, default: undefined },
    menu: { type: Object as PropType<DropdownProps['menu']>, default: undefined },
    arrow: {
      type: [Boolean, Object] as PropType<boolean | { pointAtCenter?: boolean }>,
      default: undefined,
    },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    onOpenChange: {
      type: Function as PropType<(open: boolean, info: { source: 'trigger' | 'menu' }) => void>,
      default: undefined,
    },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    placement: { type: String, default: undefined },
    transitionName: { type: String, default: undefined },
    autoAdjustOverflow: { type: Boolean, default: undefined },
    mouseEnterDelay: { type: Number, default: undefined },
    mouseLeaveDelay: { type: Number, default: undefined },
    destroyPopupOnHide: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    overlayClassName: { type: String, default: undefined },
    overlayStyle: { type: Object as PropType<StyleLike>, default: undefined },
    rootClassName: { type: String, default: undefined },
    openClassName: { type: String, default: undefined },
    id: { type: String, default: undefined },
    zIndex: { type: Number, default: undefined },
    classNames: { type: Object as PropType<DropdownProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<DropdownProps['styles']>, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
  },
  setup(props, { slots, emit, attrs, expose }) {
    const config = useComponentConfig('dropdown');
    const prefixCls = computed(() => props.prefixCls ?? config.getPrefixCls('dropdown'));
    const direction = useDirection();
    const isRtl = computed(() => direction.value === 'rtl');

    // =================== Warning（deprecated ×4 + Center） ===================
    if (import.meta.env?.DEV ?? true) {
      const values = props as Record<string, unknown>;
      for (const [deprecatedName, newName] of DEPRECATIONS) {
        if (values[deprecatedName] !== undefined) {
          console.error(
            `[Warning] [antd: Dropdown] \`${deprecatedName}\` is deprecated. Please use \`${newName}\` instead.`,
          );
        }
      }
      if (typeof props.placement === 'string' && props.placement.includes('Center')) {
        console.error(
          `[Warning] [antd: Dropdown] \`placement: ${props.placement}\` is deprecated. Please use \`placement: ${props.placement.slice(0, props.placement.indexOf('Center'))}\` instead.`,
        );
      }
    }

    // =========================== placement ============================
    const memoPlacement = computed<DropdownPopupPlacement>(() => {
      // antd 逐字（dropdown.js:108）：未指定 placement 时 rtl 翻到 bottomRight
      if (!props.placement) {
        return isRtl.value ? 'bottomRight' : 'bottomLeft';
      }
      if (props.placement.includes('Center')) {
        return props.placement.slice(
          0,
          props.placement.indexOf('Center'),
        ) as DropdownPopupPlacement;
      }
      return props.placement as DropdownPopupPlacement;
    });

    const memoTransitionName = computed(() => {
      if (props.transitionName !== undefined) return props.transitionName;
      const placement = memoPlacement.value;
      if (placement.startsWith('top')) return 'apollo-slide-down';
      if (placement.startsWith('left')) return 'apollo-slide-right';
      if (placement.startsWith('right')) return 'apollo-slide-left';
      return 'apollo-slide-up';
    });

    // =========================== placements ===========================
    const builtinPlacements = computed<Record<string, TriggerAlign>>(() => {
      const arrowConfig = typeof props.arrow === 'object' ? props.arrow : undefined;
      return getPlacements({
        arrowPointAtCenter: arrowConfig?.pointAtCenter === true,
        autoAdjustOverflow: props.autoAdjustOverflow ?? true,
        offset: 4, // marginXXS
        arrowWidth: props.arrow ? 16 : 0, // sizePopupArrow
        borderRadius: 6,
      });
    });

    // ============================ open ================================
    // ⚠️ rc 的 `useControlledState` **只写内部值、不发通知**，通知由 trigger / menu
    //    各通道自己发；本仓 `useControlledValue` 把「写值」与「通知」绑在一起
    //    （setValue ⇒ onChange），所以 menu 通道要用 `suppressNotify` 抑制第二次通知：
    //    否则 Table 过滤下拉会先收到 `source:'menu'`（它按 source 忽略）、紧接着又收到
    //    `source:'trigger'`（它照办关闭）⇒ 多选过滤点一下就消失（Issue #21 的回归）。
    let suppressNotify = false;
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        if (suppressNotify) return;
        props.onOpenChange?.(next, { source: 'trigger' });
        emit('update:open', next);
      },
    });

    const onInternalOpenChange = (next: boolean): void => {
      setOpen(next);
    };

    // ======================= menu 点击关闭 ===========================
    // ⚠️ antd 逐字（dropdown.js:149-157）：**两件事都要做** ——
    //     ① `onOpenChange(false, { source: 'menu' })`：受控消费者（如 Table 过滤下拉
    //        的 onDropdownOpenChange）有权按 source 忽略（多选过滤点菜单项不关闭）；
    //     ② `setOpen(false)`：同步内部状态。
    //    只做 ① 不做 ② 是有害的 —— 非受控用法（`open` 未传）下 emit 无人接收、
    //    内部 open 仍是 true ⇒ **点菜单项后浮层不关闭**（antd 会关）。
    const onMenuClick = (): void => {
      if (props.menu?.selectable && props.menu?.multiple) {
        return;
      }
      props.onOpenChange?.(false, { source: 'menu' });
      emit('update:open', false);
      // 通知已在上面按 `source: 'menu'` 发过 ⇒ 抑制 setValue 的默认通知
      suppressNotify = true;
      setOpen(false);
      suppressNotify = false;
    };

    // ========================== zIndex ================================
    const zIndex = useZIndex('Dropdown', () => props.zIndex, {
      zIndexPopupBase: dropdownTokenValues().zIndexPopup,
    });

    // ========================== overlay ===============================
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      DropdownProps,
      NonNullable<DropdownProps['classNames']>,
      NonNullable<DropdownProps['styles']>
    >([() => props.classNames], [() => props.styles], {} as Record<string, never>);

    // C8-R2：render fn（popupRender(node) / deprecated dropdownRender）已删除 ——
    // 自定义浮层内容走 `#popupRender="{ originNode }"` 作用域插槽。
    const triggerActions = computed<DropdownTriggerAction[]>(() =>
      props.disabled ? [] : (props.trigger ?? ['hover']),
    );

    const popupSlots: SlotsType<{
      popupRender?: (props: { originNode: VNodeChild }) => VNodeChild;
    }> = {};
    const OverlayRenderer = defineComponent({
      name: 'ADropdownOverlayRenderer',
      slots: popupSlots,
      setup(_props, { slots: overlaySlots }) {
        // ⚠️ antd `dropdown.js:194-196`：`direction === 'rtl' ? LeftOutlined : RightOutlined`
        //    ⇒ 必须在**渲染函数**里选（放在 setup 里就是快照，切 direction 后箭头不翻，
        //    Issue #21.4）。
        const override = computed(() => {
          const arrowIcon = h(isRtl.value ? LeftOutlined : RightOutlined, {
            class: `${prefixCls.value}-menu-submenu-arrow-icon`,
          });
          return {
            prefixCls: `${prefixCls.value}-menu`,
            mode: 'vertical' as const,
            selectable: false,
            onClick: onMenuClick,
            expandIcon: h('span', { class: `${prefixCls.value}-menu-submenu-arrow` }, [arrowIcon]),
            validator: ({ mode }: { mode?: string }) => {
              if (mode && mode !== 'vertical') {
                console.error(
                  `[Warning] [antd: Dropdown] mode="${mode}" is not supported for Dropdown's Menu.`,
                );
              }
            },
          };
        });
        return () => {
          let overlayNode: VNodeChild = props.menu?.items
            ? h(Menu, {
                ...(props.menu as object),
                prefixCls: `${prefixCls.value}-menu`,
              } as never)
            : null;
          if (overlaySlots.popupRender) {
            overlayNode = overlaySlots.popupRender({ originNode: overlayNode });
          }
          if (typeof overlayNode === 'string') {
            overlayNode = h('span', overlayNode);
          } else if (overlayNode === null || overlayNode === undefined) {
            overlayNode = null;
          }
          return h(OverlayProvider, { override: override.value }, () => overlayNode as VNodeChild);
        };
      },
    });

    // ============================ expose ==============================
    const triggerRef = shallowRef<{
      forceAlign: () => void;
      nativeElement: () => HTMLElement | null;
      popupElement: () => HTMLElement | null;
    } | null>(null);
    expose({
      forceAlign: () => triggerRef.value?.forceAlign(),
      nativeElement: () => triggerRef.value?.nativeElement() ?? null,
      popupElement: () => triggerRef.value?.popupElement() ?? null,
    });

    return () => {
      const children = slots.default?.();
      // rc Children.only：单 children；字符串/数字 ⇒ 包一层 span（原始值分支）
      const arr = Array.isArray(children) ? children : [children];
      const only = arr.length === 1 ? arr[0] : undefined;
      let child: VNodeChild;
      if (typeof only === 'string' || typeof only === 'number') {
        child = h('span', [only]);
      } else {
        child = (only ?? children) as VNodeChild;
      }

      // rc popupTrigger 的 -open 类（openClassName 可覆盖）
      const openCls = mergedOpen.value ? (props.openClassName ?? `${prefixCls.value}-open`) : '';

      // rc popupTrigger：child 上注入 -trigger/-open 类与 disabled 透传
      const childProps = (isVNode(child) ? ((child as VNodeLike).props ?? {}) : {}) as {
        disabled?: boolean;
      };
      // antd 逐字（dropdown.js:140）：触发器类名带 `-rtl`（direction === 'rtl'）
      const rtlCls = isRtl.value ? `${prefixCls.value}-rtl` : undefined;
      const triggerNode = isVNode(child)
        ? cloneVNode(
            child as VNodeLike,
            {
              class: [`${prefixCls.value}-trigger`, rtlCls, openCls || undefined],
              disabled: childProps.disabled ?? props.disabled,
            } as never,
          )
        : h('span', { class: [`${prefixCls.value}-trigger`, rtlCls] }, [child as VNodeChild]);

      const rootCls = [
        props.overlayClassName,
        props.rootClassName,
        mergedClassNames.value.root,
      ].filter(Boolean);

      const popup = h(
        'div',
        {
          class: [rootCls.length > 0 ? rootCls : undefined],
          style: {
            ...(mergedStyles.value.root ?? {}),
            ...props.overlayStyle,
          },
        },
        [h(OverlayRenderer, null, slots.popupRender ? { popupRender: slots.popupRender } : {})],
      );

      return h(
        Trigger,
        {
          ref: triggerRef as never,
          prefixCls: prefixCls.value,
          popup,
          action: triggerActions.value as never,
          open: mergedOpen.value,
          onOpenChange: onInternalOpenChange,
          afterOpenChange: props.afterOpenChange,
          disabled: props.disabled,
          alignPoint: triggerActions.value.includes('contextMenu'),
          // rc-dropdown 的 minOverlayWidthMatchTrigger（默认 !alignPoint）⇒
          // stretch='minWidth'：浮层不窄于触发元素（L6 的 93.95px 实测来源）。
          stretch: triggerActions.value.includes('contextMenu') ? undefined : 'minWidth',
          mouseEnterDelay: props.mouseEnterDelay ?? 0.15,
          mouseLeaveDelay: props.mouseLeaveDelay ?? 0.1,
          placement: memoPlacement.value,
          builtinPlacements: builtinPlacements.value,
          getPopupContainer: props.getPopupContainer ?? config.getPopupContainer,
          motion: {
            motionName: memoTransitionName.value,
            motionDeadline: 1000,
          },
          destroyOnHidden: props.destroyOnHidden ?? props.destroyPopupOnHide,
          forceRender: props.forceRender,
          arrow: props.arrow
            ? { content: h('span', { class: `${prefixCls.value}-arrow-content` }) }
            : undefined,
          zIndex: zIndex.value,
          popupClassName: undefined,
          popupStyle: { zIndex: zIndex.value } as StyleLike,
          ...attrs,
        },
        { default: () => triggerNode as VNodeChild },
      );
    };
  },
});

export default Dropdown;
