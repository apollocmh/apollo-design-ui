/** Dropdown composes the shared Trigger and Menu using current Vue contracts. */
import { getPlacements } from '@apollo-design/position';
import { useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  Comment,
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  isVNode,
  normalizeClass,
  type PropType,
  type SlotsType,
  shallowRef,
  Text,
} from 'vue';
import { Trigger } from '../_internal/trigger';
import { useConsumerZIndex } from '../_internal/use-consumer-z-index';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import DropdownMenu from './DropdownMenu';
import type {
  DropdownClassNames,
  DropdownOpenInfo,
  DropdownPlacement,
  DropdownPopupPlacement,
  DropdownProps,
  DropdownRef,
  DropdownSemanticType,
  DropdownSlots,
  DropdownStyles,
  DropdownTriggerAction,
} from './interface';
import { useDropdownTheme } from './use-dropdown-theme';

const Dropdown = defineComponent({
  name: 'ADropdown',
  inheritAttrs: false,
  slots: Object as SlotsType<DropdownSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    trigger: { type: Array as PropType<DropdownTriggerAction[]>, default: undefined },
    menu: { type: Object as PropType<DropdownProps['menu']>, default: undefined },
    arrow: { type: [Boolean, Object] as PropType<DropdownProps['arrow']>, default: undefined },
    open: { type: Boolean, default: undefined },
    defaultOpen: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    placement: { type: String as PropType<DropdownPlacement>, default: undefined },
    transitionName: { type: String, default: undefined },
    autoAdjustOverflow: { type: Boolean, default: undefined },
    mouseEnterDelay: { type: Number, default: undefined },
    mouseLeaveDelay: { type: Number, default: undefined },
    destroyPopupOnHide: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    forceRender: { type: Boolean, default: undefined },
    getPopupContainer: {
      type: Function as PropType<DropdownProps['getPopupContainer']>,
      default: undefined,
    },
    overlayClassName: { type: String, default: undefined },
    overlayStyle: { type: Object as PropType<DropdownProps['overlayStyle']>, default: undefined },
    rootClassName: { type: String, default: undefined },
    openClassName: { type: String, default: undefined },
    id: { type: String, default: undefined },
    zIndex: { type: Number, default: undefined },
    classNames: { type: [Object, Function] as PropType<DropdownClassNames>, default: undefined },
    styles: { type: [Object, Function] as PropType<DropdownStyles>, default: undefined },
  },
  emits: {
    'update:open': (_open: boolean) => true,
    openChange: (_open: boolean, _info: DropdownOpenInfo) => true,
    afterOpenChange: (_open: boolean) => true,
  },
  setup(props, { slots, emit, attrs, expose }) {
    const config = useComponentConfig<
      ComponentStyleConfig & {
        classNames?: DropdownClassNames;
        styles?: DropdownStyles;
        arrow?: DropdownProps['arrow'];
        trigger?: DropdownTriggerAction[];
        mouseEnterDelay?: number;
        mouseLeaveDelay?: number;
      }
    >('dropdown');
    const prefixCls = computed(() => props.prefixCls ?? config.getPrefixCls('dropdown'));
    const direction = useDirection();
    const rtl = computed(() => direction.value === 'rtl');
    const disabled = useDisabled(() => props.disabled);
    const theme = useDropdownTheme();
    const arrow = computed(() => props.arrow ?? config.arrow ?? false);
    const triggerActions = computed<DropdownTriggerAction[]>(() =>
      disabled.value ? [] : (props.trigger ?? config.trigger ?? ['hover']),
    );
    const enterDelay = computed(() => props.mouseEnterDelay ?? config.mouseEnterDelay ?? 0.15);
    const leaveDelay = computed(() => props.mouseLeaveDelay ?? config.mouseLeaveDelay ?? 0.1);
    const warning = useDevWarning('Dropdown');
    warning.deprecated(
      props.destroyPopupOnHide === undefined,
      'destroyPopupOnHide',
      'destroyOnHidden',
    );
    warning.deprecated(props.overlayClassName === undefined, 'overlayClassName', 'classNames.root');
    warning.deprecated(props.overlayStyle === undefined, 'overlayStyle', 'styles.root');
    warning.deprecated(props.placement !== 'topCenter', 'placement: topCenter', 'placement: top');
    warning.deprecated(
      props.placement !== 'bottomCenter',
      'placement: bottomCenter',
      'placement: bottom',
    );

    const placement = computed<DropdownPopupPlacement>(() => {
      if (props.placement === 'topCenter') return 'top';
      if (props.placement === 'bottomCenter') return 'bottom';
      return props.placement ?? (rtl.value ? 'bottomRight' : 'bottomLeft');
    });
    const transitionName = computed(() => {
      if (props.transitionName !== undefined) return props.transitionName;
      if (placement.value.startsWith('top')) return 'apollo-slide-down';
      if (placement.value.startsWith('left')) return 'apollo-slide-right';
      if (placement.value.startsWith('right')) return 'apollo-slide-left';
      return 'apollo-slide-up';
    });
    const builtinPlacements = computed(() =>
      getPlacements({
        arrowPointAtCenter: typeof arrow.value === 'object' && arrow.value.pointAtCenter === true,
        autoAdjustOverflow: props.autoAdjustOverflow ?? true,
        offset: theme.theme.token.value.marginXXS,
        arrowWidth: arrow.value ? theme.theme.token.value.sizePopupArrow : 0,
        borderRadius: theme.theme.token.value.borderRadius,
      }),
    );
    const [open, setOpen] = useControlledValue<boolean>({
      defaultValue: () => props.defaultOpen ?? false,
      getValue: () => props.open,
    });
    const changeOpen = (next: boolean, source: DropdownOpenInfo['source']) => {
      setOpen(next);
      emit('openChange', next, { source });
      emit('update:open', next);
    };
    const onMenuClick = () => {
      if (!(props.menu?.selectable && props.menu.multiple)) changeOpen(false, 'menu');
    };
    const mergedProps = computed<DropdownProps>(() => ({
      ...props,
      open: open.value,
      disabled: disabled.value,
      arrow: arrow.value,
      trigger: triggerActions.value,
      mouseEnterDelay: enterDelay.value,
      mouseLeaveDelay: leaveDelay.value,
    }));
    const semantic = useMergeSemantic<
      DropdownProps,
      NonNullable<DropdownSemanticType['classNames']>,
      NonNullable<DropdownSemanticType['styles']>
    >(
      [() => config.classNames, () => props.classNames],
      [
        () => config.styles,
        () => (config.style ? { root: config.style } : undefined),
        () => props.styles,
        () => (props.overlayStyle ? { root: props.overlayStyle } : undefined),
      ],
      mergedProps,
    );
    const zIndex = useConsumerZIndex(
      'Dropdown',
      () => props.zIndex ?? semantic.styles.value.root?.zIndex,
      () => theme.componentToken.value.zIndexPopup,
    );
    const triggerRef = shallowRef<DropdownRef | null>(null);
    const publicApi: DropdownRef = {
      forceAlign: () => triggerRef.value?.forceAlign(),
      nativeElement: () => triggerRef.value?.nativeElement() ?? null,
      popupElement: () => triggerRef.value?.popupElement() ?? null,
    };
    expose(publicApi);

    return () => {
      const children = slots.default?.();
      const child = Array.isArray(children) && children.length === 1 ? children[0] : children;
      const classes = [
        `${prefixCls.value}-trigger`,
        rtl.value ? `${prefixCls.value}-rtl` : undefined,
        open.value ? (props.openClassName ?? `${prefixCls.value}-open`) : undefined,
      ];
      const native =
        isVNode(child) && child.type !== Text && child.type !== Comment && child.type !== Fragment;
      const target = native
        ? cloneVNode(child, {
            ...attrs,
            ...(props.id === undefined ? {} : { id: props.id }),
            class: [attrs.class, classes],
            disabled: child.props?.disabled ?? disabled.value,
          })
        : h('span', { ...attrs, id: props.id, class: [attrs.class, classes] }, [child]);
      const popup = h('div', [
        h(
          DropdownMenu,
          {
            prefixCls: prefixCls.value,
            rtl: rtl.value,
            menu: props.menu,
            classNames: semantic.classNames.value,
            styles: semantic.styles.value,
            onMenuClick,
          },
          slots.popupRender ? { popupRender: slots.popupRender } : {},
        ),
      ]);
      return h(
        Trigger,
        {
          ref: triggerRef,
          prefixCls: prefixCls.value,
          popup,
          action: triggerActions.value,
          open: open.value,
          onOpenChange: (next: boolean) => changeOpen(next, 'trigger'),
          afterOpenChange: (next: boolean) => emit('afterOpenChange', next),
          disabled: disabled.value,
          alignPoint: triggerActions.value.includes('contextMenu'),
          stretch: triggerActions.value.includes('contextMenu') ? undefined : 'minWidth',
          mouseEnterDelay: enterDelay.value,
          mouseLeaveDelay: leaveDelay.value,
          placement: placement.value,
          builtinPlacements: builtinPlacements.value,
          getPopupContainer: props.getPopupContainer ?? config.getPopupContainer,
          motion: { motionName: transitionName.value, motionDeadline: 1000 },
          destroyOnHidden: props.destroyOnHidden ?? props.destroyPopupOnHide,
          forceRender: props.forceRender,
          arrow: arrow.value
            ? { content: h('span', { class: `${prefixCls.value}-arrow-content` }) }
            : undefined,
          zIndex: zIndex.value,
          popupClassName: normalizeClass([
            config.className,
            props.overlayClassName,
            props.rootClassName,
            semantic.classNames.value.root,
          ]),
          popupStyle: {
            direction: direction.value,
            ...theme.style.value,
            ...semantic.styles.value.root,
            zIndex: zIndex.value ?? semantic.styles.value.root?.zIndex,
          },
        },
        { default: () => target },
      );
    };
  },
});

export default Dropdown;
