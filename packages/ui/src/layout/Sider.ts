import { BarsOutlined, LeftOutlined, RightOutlined } from '@apollo-design/icons';
import { useResizeObserver } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onMounted,
  onScopeDispose,
  type PropType,
  type SlotsType,
  shallowRef,
  useId,
  watch,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { provideSiderContext, useLayoutContext } from './context';
import type {
  Breakpoint,
  CollapseType,
  LayoutConfig,
  SiderProps,
  SiderSemanticClassNames,
  SiderSemanticStyles,
  SiderSlots,
  SiderTheme,
} from './interface';
import { useLayoutTheme } from './use-layout-theme';

const dimensionMaxMap: Record<Breakpoint, string> = {
  xs: '479.98px',
  sm: '575.98px',
  md: '767.98px',
  lg: '991.98px',
  xl: '1199.98px',
  xxl: '1599.98px',
  xxxl: '1839.98px',
};
const cssWidth = (value: number | string) =>
  !Number.isNaN(Number.parseFloat(String(value))) && Number.isFinite(Number(value))
    ? String(value) + 'px'
    : String(value);

export const SiderComponent = defineComponent({
  name: 'ALayoutSider',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    collapsible: { type: Boolean, default: false },
    collapsed: { type: Boolean, default: undefined },
    defaultCollapsed: { type: Boolean, default: false },
    reverseArrow: { type: Boolean, default: false },
    zeroWidthTriggerStyle: {
      type: Object as PropType<SiderProps['zeroWidthTriggerStyle']>,
      default: undefined,
    },
    trigger: { type: null as unknown as PropType<SiderProps['trigger']>, default: undefined },
    width: { type: [Number, String] as PropType<number | string>, default: 200 },
    collapsedWidth: { type: [Number, String] as PropType<number | string>, default: 80 },
    breakpoint: { type: String as PropType<Breakpoint>, default: undefined },
    theme: { type: String as PropType<SiderTheme>, default: 'dark' },
    classNames: {
      type: [Object, Function] as PropType<SiderProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<SiderProps['styles']>, default: undefined },
  },
  emits: {
    'update:collapsed': (_collapsed: boolean) => true,
    collapse: (_collapsed: boolean, _type: CollapseType) => true,
    breakpoint: (_broken: boolean) => true,
  },
  slots: Object as SlotsType<SiderSlots>,
  setup(props, { attrs, emit, expose, slots }) {
    const rootRef = shallowRef<HTMLElement | null>(null);
    const bodyRef = shallowRef<HTMLElement | null>(null);
    const triggerRef = shallowRef<HTMLButtonElement | null>(null);
    const context = useComponentConfig<LayoutConfig>('layout');
    const direction = useDirection();
    const prefixCls = computed(() => context.getPrefixCls('layout-sider', props.prefixCls));
    const themeStyle = useLayoutTheme(() =>
      prefixCls.value.endsWith('-sider') ? prefixCls.value.slice(0, -6) : prefixCls.value,
    );
    const layoutContext = useLayoutContext();
    const bodyId = 'apollo-sider-' + useId();
    const innerCollapsed = shallowRef(props.collapsed ?? props.defaultCollapsed);
    const mergedCollapsed = computed(() => props.collapsed ?? innerCollapsed.value);
    watch(
      () => props.collapsed,
      (value) => {
        if (value !== undefined) innerCollapsed.value = value;
      },
    );
    const handleSetCollapsed = (value: boolean, type: CollapseType) => {
      if (props.collapsed === undefined) innerCollapsed.value = value;
      emit('update:collapsed', value);
      emit('collapse', value, type);
    };
    const below = shallowRef(false);
    let mounted = false;
    let mql: MediaQueryList | undefined;
    let legacy = false;
    const responsiveHandler = (event: MediaQueryList | MediaQueryListEvent) => {
      if (!mounted) return;
      below.value = event.matches;
      emit('breakpoint', event.matches);
      if (mergedCollapsed.value !== event.matches) handleSetCollapsed(event.matches, 'responsive');
    };
    const detachResponsive = () => {
      if (legacy) mql?.removeListener(responsiveHandler);
      else mql?.removeEventListener('change', responsiveHandler);
      mql = undefined;
    };
    const attachResponsive = () => {
      detachResponsive();
      const breakpoint = props.breakpoint;
      if (
        !breakpoint ||
        !(breakpoint in dimensionMaxMap) ||
        typeof window.matchMedia !== 'function'
      ) {
        below.value = false;
        return;
      }
      const next = window.matchMedia('screen and (max-width: ' + dimensionMaxMap[breakpoint] + ')');
      mql = next;
      legacy = typeof next.addEventListener !== 'function';
      if (legacy) next.addListener(responsiveHandler);
      else next.addEventListener('change', responsiveHandler);
      responsiveHandler(next);
    };
    onMounted(() => {
      mounted = true;
      layoutContext.siderHook.addSider(bodyId);
      attachResponsive();
    });
    watch(
      () => props.breakpoint,
      () => {
        if (mounted) attachResponsive();
      },
    );
    onScopeDispose(() => {
      mounted = false;
      detachResponsive();
      layoutContext.siderHook.removeSider(bodyId);
    });

    const semanticProps = computed<SiderProps>(() => ({
      ...props,
      collapsed: mergedCollapsed.value,
    }));
    const semantic = useMergeSemantic<SiderProps, SiderSemanticClassNames, SiderSemanticStyles>(
      [() => props.classNames],
      [() => props.styles],
      semanticProps,
    );
    const siderWidth = computed(() =>
      cssWidth(mergedCollapsed.value ? props.collapsedWidth : props.width),
    );
    const measuredWidth = shallowRef<{ css: string; zero: boolean }>();
    useResizeObserver({
      target: rootRef,
      onResize: (size) => {
        measuredWidth.value = { css: siderWidth.value, zero: size.width === 0 };
      },
    });
    const hiddenBody = computed(
      () =>
        Number.parseFloat(siderWidth.value) === 0 ||
        (measuredWidth.value?.css === siderWidth.value && measuredWidth.value.zero),
    );
    const isZeroWidthTrigger = computed(
      () =>
        Number.parseFloat(String(props.collapsedWidth)) === 0 ||
        (mergedCollapsed.value && hiddenBody.value),
    );
    watch(hiddenBody, (hidden) => {
      const document = rootRef.value?.ownerDocument;
      const active = document?.activeElement;
      if (!hidden || !document || !active || !bodyRef.value?.contains(active)) return;
      void nextTick(() => {
        if (
          hiddenBody.value &&
          (document.activeElement === active || document.activeElement === document.body)
        )
          triggerRef.value?.focus({ preventScroll: true });
      });
    });
    provideSiderContext({ siderCollapsed: mergedCollapsed });
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    return () => {
      const cls = prefixCls.value;
      const zero = isZeroWidthTrigger.value;
      const hasTrigger = Boolean(slots.trigger) || props.trigger !== null;
      const showTrigger = hasTrigger && (props.collapsible || (below.value && zero));
      const reverseIcon = (direction.value === 'rtl') === !props.reverseArrow;
      const icon = zero
        ? BarsOutlined
        : mergedCollapsed.value === reverseIcon
          ? LeftOutlined
          : RightOutlined;
      const content = slots.trigger
        ? slots.trigger()
        : props.trigger === undefined
          ? h(icon, { 'aria-hidden': 'true' })
          : props.trigger;
      return h(
        'aside',
        mergeProps(
          {
            ref: rootRef,
            dir: direction.value,
            class: [
              cls,
              cls + '-' + props.theme,
              {
                [cls + '-collapsed']: mergedCollapsed.value,
                [cls + '-has-trigger']: props.collapsible && hasTrigger && !zero,
                [cls + '-below']: below.value,
                [cls + '-zero-width']: hiddenBody.value,
              },
              context.className,
              semantic.classNames.value.root,
            ],
            style: [themeStyle.value, semantic.styles.value.root],
          },
          attrs,
          {
            style: {
              flex: '0 0 ' + siderWidth.value,
              maxWidth: siderWidth.value,
              minWidth: siderWidth.value,
              width: siderWidth.value,
            },
          },
        ),
        [
          h(
            'div',
            {
              ref: bodyRef,
              id: bodyId,
              class: [cls + '-children', semantic.classNames.value.body],
              style: semantic.styles.value.body,
              inert: hiddenBody.value ? true : undefined,
              'aria-hidden': hiddenBody.value ? 'true' : undefined,
            },
            [slots.default?.()],
          ),
          showTrigger
            ? h(
                'button',
                {
                  ref: triggerRef,
                  type: 'button',
                  class: zero
                    ? [
                        cls + '-zero-width-trigger',
                        cls + '-zero-width-trigger-' + (props.reverseArrow ? 'right' : 'left'),
                      ]
                    : cls + '-trigger',
                  style: zero ? props.zeroWidthTriggerStyle : { width: siderWidth.value },
                  'aria-label': mergedCollapsed.value ? 'Expand sidebar' : 'Collapse sidebar',
                  'aria-expanded': !mergedCollapsed.value,
                  'aria-controls': bodyId,
                  onClick: () => handleSetCollapsed(!mergedCollapsed.value, 'clickTrigger'),
                },
                [content],
              )
            : null,
        ],
      );
    };
  },
});
export const Sider = SiderComponent;
export default Sider;
