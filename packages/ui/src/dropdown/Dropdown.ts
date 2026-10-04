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

import { RightOutlined } from '@apollo-design/icons';
import { useZIndex } from '@apollo-design/portal';
import { getPlacements } from '@apollo-design/position';
import { useControlledValue } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  type PropType,
  provide,
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

type StyleLike = Record<string, string | number>;

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
    const { getPrefixCls } = useComponentConfig('dropdown');
    const prefixCls = props.prefixCls ?? getPrefixCls('dropdown');
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
    const [mergedOpen, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
      onChange: (next: boolean) => {
        props.onOpenChange?.(next, { source: 'trigger' });
        emit('update:open', next);
      },
    });

    const onInternalOpenChange = (next: boolean): void => {
      setOpen(next);
    };

    // ======================= menu 点击关闭 ===========================
    // ⚠️ antd dropdown.js:149-155：只通知 `onOpenChange(false, {source:'menu'})`，
    //    **不**直接改内部 open —— 受控消费者（如 Table 过滤下拉的
    //    onDropdownOpenChange）有权按 source 忽略（多选过滤点击菜单项不关闭）。
    //    此前多写的 setOpen/emit 会绕过受控拦截 ⇒ 过滤菜单一点就消失。
    const onMenuClick = (): void => {
      if (props.menu?.selectable && props.menu?.multiple) {
        return;
      }
      props.onOpenChange?.(false, { source: 'menu' });
      emit('update:open', false);
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
    const popupRenderFn = slots.popupRender
      ? (node: VNodeChild) =>
          (slots.popupRender as (p: { originNode: VNodeChild }) => unknown)({
            originNode: node,
          })
      : undefined;
    const mergedPopupRender = popupRenderFn;

    const triggerActions = computed<DropdownTriggerAction[]>(() =>
      props.disabled ? [] : (props.trigger ?? ['hover']),
    );

    const OverlayRenderer = defineComponent({
      name: 'ADropdownOverlayRenderer',
      setup() {
        const arrowIcon = h(RightOutlined, { class: `${prefixCls}-menu-submenu-arrow-icon` });
        const override = {
          prefixCls: `${prefixCls}-menu`,
          mode: 'vertical' as const,
          selectable: false,
          onClick: onMenuClick,
          expandIcon: h('span', { class: `${prefixCls}-menu-submenu-arrow` }, [arrowIcon]),
          validator: ({ mode }: { mode?: string }) => {
            if (mode && mode !== 'vertical') {
              console.error(
                `[Warning] [antd: Dropdown] mode="${mode}" is not supported for Dropdown's Menu.`,
              );
            }
          },
        };
        return () => {
          let overlayNode: VNodeChild = props.menu?.items
            ? h(Menu, {
                ...(props.menu as object),
                prefixCls: `${prefixCls}-menu`,
              } as never)
            : null;
          if (mergedPopupRender) {
            overlayNode = mergedPopupRender(overlayNode) as VNodeChild;
          }
          if (typeof overlayNode === 'string') {
            overlayNode = h('span', overlayNode);
          } else if (overlayNode === null || overlayNode === undefined) {
            overlayNode = null;
          }
          return h(OverlayProvider, { override }, () => overlayNode as VNodeChild);
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
      const openCls = mergedOpen.value ? (props.openClassName ?? `${prefixCls}-open`) : '';

      // rc popupTrigger：child 上注入 -trigger/-open 类与 disabled 透传
      const childProps = (isVNode(child) ? ((child as VNodeLike).props ?? {}) : {}) as {
        disabled?: boolean;
      };
      // antd 逐字（dropdown.js:140）：触发器类名带 `-rtl`（direction === 'rtl'）
      const rtlCls = isRtl.value ? `${prefixCls}-rtl` : undefined;
      const triggerNode = isVNode(child)
        ? cloneVNode(
            child as VNodeLike,
            {
              class: [`${prefixCls}-trigger`, rtlCls, openCls || undefined],
              disabled: childProps.disabled ?? props.disabled,
            } as never,
          )
        : h('span', { class: [`${prefixCls}-trigger`, rtlCls] }, [child as VNodeChild]);

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
            ...(props.overlayStyle as StyleLike | undefined),
          },
        },
        [h(OverlayRenderer)],
      );

      return h(
        Trigger,
        {
          ref: triggerRef as never,
          prefixCls,
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
          getPopupContainer: props.getPopupContainer,
          motion: {
            motionName: memoTransitionName.value,
            motionDeadline: 1000,
          },
          destroyOnHidden: props.destroyOnHidden ?? props.destroyPopupOnHide,
          forceRender: props.forceRender,
          arrow: props.arrow
            ? { content: h('span', { class: `${prefixCls}-arrow-content` }) }
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
