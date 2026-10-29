/** One Vue-owned state/Provider scope; items and declared Panels share the same renderer. */
import { RightOutlined } from '@apollo-design/icons';
import { initCollapseMotion } from '@apollo-design/motion';
import { mergeDomAttrs, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  inject,
  type PropType,
  provide,
  ref,
  type SlotsType,
  shallowRef,
  watch,
} from 'vue';
import { mergeClassNames, mergeStyles, resolveSemantic } from '../_internal/use-merge-semantic';
import { withInstall } from '../_internal/with-install';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { collapseContextKey, isHeadingLevel } from './context';
import { getActiveKeysArray } from './engine';
import type {
  CollapseConfig,
  CollapseHeadingLevel,
  CollapseItemType,
  CollapseProps,
  CollapseSemanticClassNames,
  CollapseSemanticStyles,
  CollapseSize,
  CollapseSlots,
  CollapsibleType,
  ExpandIconPlacement,
} from './interface';
import { CollapsePanel } from './Panel';
import { useCollapseTheme } from './use-collapse-theme';

const CollapseComponent = defineComponent({
  name: 'ACollapse',
  inheritAttrs: false,
  slots: Object as SlotsType<CollapseSlots>,
  props: {
    items: { type: Array as PropType<CollapseItemType[]>, default: undefined },
    activeKey: {
      type: [Array, String, Number] as PropType<CollapseProps['activeKey']>,
      default: undefined,
    },
    defaultActiveKey: {
      type: [Array, String, Number] as PropType<CollapseProps['defaultActiveKey']>,
      default: undefined,
    },
    accordion: { type: Boolean, default: false },
    destroyInactivePanel: { type: Boolean, default: undefined },
    destroyOnHidden: { type: Boolean, default: undefined },
    bordered: { type: Boolean, default: true },
    prefixCls: { type: String, default: undefined },
    expandIconPlacement: { type: String as PropType<ExpandIconPlacement>, default: undefined },
    expandIconPosition: { type: String as PropType<ExpandIconPlacement>, default: undefined },
    ghost: { type: Boolean, default: false },
    size: { type: String as PropType<CollapseSize>, default: undefined },
    collapsible: { type: String as PropType<CollapsibleType>, default: undefined },
    headingLevel: {
      type: Number as PropType<CollapseHeadingLevel>,
      validator: isHeadingLevel,
      default: undefined,
    },
    classNames: { type: Object as PropType<CollapseProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<CollapseProps['styles']>, default: undefined },
  },
  emits: { change: (_keys: string[]) => true, 'update:activeKey': (_keys: string[]) => true },
  setup(props, { attrs, slots, emit, expose }) {
    const config = useComponentConfig<CollapseConfig>('collapse');
    const inheritedDirection = useDirection();
    const inheritedSize = useSize();
    const parent = inject(collapseContextKey, undefined);
    const root = shallowRef<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return root.value;
      },
    });
    const prefixCls = computed(() => config.getPrefixCls('collapse', props.prefixCls));
    const theme = useCollapseTheme(() => prefixCls.value);
    const direction = computed<'ltr' | 'rtl'>(() =>
      inheritedDirection.value === 'rtl' ? 'rtl' : 'ltr',
    );
    const size = computed<CollapseSize>(
      () =>
        props.size ??
        (inheritedSize.value === 'small'
          ? 'small'
          : inheritedSize.value === 'large'
            ? 'large'
            : 'middle'),
    );
    const placement = computed(
      () => props.expandIconPlacement ?? props.expandIconPosition ?? 'start',
    );
    const headingLevel = computed<CollapseHeadingLevel>(() => {
      if (isHeadingLevel(props.headingLevel)) return props.headingLevel;
      const nested = parent ? Math.min(6, parent.headingLevel.value + 1) : 3;
      return isHeadingLevel(nested) ? nested : 3;
    });
    const info = () => ({
      props: {
        ...props,
        prefixCls: prefixCls.value,
        size: size.value,
        headingLevel: headingLevel.value,
      },
    });
    const classNames = computed(() =>
      mergeClassNames<CollapseSemanticClassNames>(
        resolveSemantic(config.classNames, info()),
        resolveSemantic(props.classNames, info()),
      ),
    );
    const styles = computed(() =>
      mergeStyles<CollapseSemanticStyles>(
        resolveSemantic(config.styles, info()),
        { root: config.style },
        resolveSemantic(props.styles, info()),
      ),
    );
    const accepted = ref(
      getActiveKeysArray(props.activeKey !== undefined ? props.activeKey : props.defaultActiveKey),
    );
    watch(
      () => props.activeKey,
      (value) => {
        if (value !== undefined) accepted.value = getActiveKeysArray(value);
      },
      { deep: true, flush: 'sync' },
    );
    const activeKeys = computed(() =>
      props.activeKey !== undefined ? getActiveKeysArray(props.activeKey) : accepted.value,
    );
    const toggle = (key: string) => {
      const next = props.accordion
        ? activeKeys.value[0] === key
          ? []
          : [key]
        : activeKeys.value.includes(key)
          ? activeKeys.value.filter((value) => value !== key)
          : [...activeKeys.value, key];
      if (props.activeKey === undefined) accepted.value = next;
      emit('update:activeKey', next);
      emit('change', next);
    };
    let nextKey = 0;
    provide(collapseContextKey, {
      prefixCls,
      activeKeys,
      accordion: computed(() => props.accordion),
      bordered: computed(() => props.bordered),
      ghost: computed(() => props.ghost),
      size,
      placement,
      direction,
      headingLevel,
      collapsible: computed(() => props.collapsible),
      destroyOnHidden: computed(() => props.destroyOnHidden ?? props.destroyInactivePanel ?? false),
      classNames,
      styles,
      motion: computed(() => ({
        ...initCollapseMotion(),
        motionName: `${prefixCls.value}-motion`,
      })),
      supportMotion: theme.supportMotion,
      allocateKey: () => String(nextKey++),
      toggle,
      focusRoot: () => {
        const element = root.value;
        if (!element) return;
        const hasTabIndex = element.hasAttribute('tabindex');
        if (!hasTabIndex) {
          element.tabIndex = -1;
          element.addEventListener(
            'blur',
            () => {
              if (
                (attrs.tabindex === undefined || attrs.tabindex === null) &&
                element.getAttribute('tabindex') === '-1'
              )
                element.removeAttribute('tabindex');
            },
            { once: true },
          );
        }
        element.focus({ preventScroll: true });
      },
      icon: (scope) =>
        slots.expandIcon
          ? slots.expandIcon(scope)
          : config.expandIcon
            ? config.expandIcon(scope)
            : h(RightOutlined, {
                rotate: scope.isActive ? 90 : scope.direction === 'rtl' ? 180 : undefined,
              }),
    });
    const warning = useDevWarning('Collapse');
    watch(
      () => [props.destroyInactivePanel, props.expandIconPosition] as const,
      ([destroy, position]) => {
        warning.deprecated(destroy === undefined, 'destroyInactivePanel', 'destroyOnHidden');
        warning.deprecated(position === undefined, 'expandIconPosition', 'expandIconPlacement');
      },
      { immediate: true },
    );
    return () => {
      const cls = prefixCls.value;
      const { children: _children, expandIcon: _expandIcon, ...nativeAttrs } = attrs;
      const rootAttrs = mergeDomAttrs(
        {
          class: [
            cls,
            `${cls}-icon-placement-${placement.value}`,
            {
              [`${cls}-borderless`]: !props.bordered,
              [`${cls}-ghost`]: props.ghost,
              [`${cls}-small`]: size.value === 'small',
              [`${cls}-large`]: size.value === 'large',
              [`${cls}-rtl`]: direction.value === 'rtl',
            },
            config.className,
            classNames.value.root,
          ],
          style: [theme.styles.value, styles.value.root],
        },
        nativeAttrs,
      );
      rootAttrs.ref = root;
      const children = Array.isArray(props.items)
        ? props.items.map((item, index) =>
            h(
              CollapsePanel,
              {
                key: String(item.key ?? index),
                label: item.label ?? item.header,
                className: item.className,
                style: item.style,
                showArrow: item.showArrow,
                forceRender: item.forceRender,
                collapsible: item.collapsible,
                destroyOnHidden: item.destroyOnHidden,
                onItemClick: item.onItemClick,
                headerClass: item.headerClass,
                id: item.id,
                classNames: item.classNames,
                styles: item.styles,
              },
              { default: () => item.children, extra: () => item.extra },
            ),
          )
        : slots.default?.();
      return h('div', rootAttrs, [children]);
    };
  },
});
export const Collapse = Object.assign(withInstall(CollapseComponent), { Panel: CollapsePanel });
export const CollapseWithPanel = Collapse;
export default Collapse;
