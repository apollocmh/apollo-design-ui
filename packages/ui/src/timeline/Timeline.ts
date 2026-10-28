/** Timeline renders Steps as ol/li. Keep data, layout, providers and semantic
 * mappings reactive; read native attrs during render and preserve keyed content. */
import { devUseWarning, getElement, isEmptyVNode } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  normalizeClass,
  normalizeStyle,
  type PropType,
  provide,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { Steps } from '../steps';
import { stepsInternalContextKey, stepsUnstableContextKey } from '../steps/context';
import type {
  TimelineConfig,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
  TimelineSlots,
} from './interface';
import { useItems } from './use-items';
import { useTimelineTheme } from './use-theme';

/** `classNames` 的八键 → `timeline` 前缀（判据 5）。 */
const stepsClassNamesOf = (prefixCls: string): Record<string, string> => ({
  item: `${prefixCls}-item`,
  itemTitle: `${prefixCls}-item-title`,
  itemIcon: `${prefixCls}-item-icon`,
  itemContent: `${prefixCls}-item-content`,
  itemRail: `${prefixCls}-item-rail`,
  itemWrapper: `${prefixCls}-item-wrapper`,
  itemSection: `${prefixCls}-item-section`,
  itemHeader: `${prefixCls}-item-header`,
});

/** `mergedMode` 的归一（判据 1）。 */
function mergeMode(mode?: TimelineMode): TimelineMode {
  if (mode === 'left') return 'start';
  if (mode === 'right') return 'end';
  return mode === 'alternate' || mode === 'start' || mode === 'end' ? mode : 'start';
}

/** Steps treats truthy icon data as custom; retain explicit scalar Vue content. */
const completeIcon = (icon: VNodeChild): VNodeChild =>
  icon === 0 || icon === false || icon === '' ? [icon] : icon;

const Timeline = defineComponent({
  name: 'ATimeline',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    // ⚠️ **必须收 `[Object, Function]`** —— 语义化槽支持**函数形态**
    //    （`(info) => styles`）。只写 `Object` 时函数会触发
    //    `Invalid prop: type check failed` 的 Vue 告警（demo 冒烟实测抓到）。
    classNames: {
      type: [Object, Function] as PropType<TimelineProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<TimelineProps['styles']>,
      default: undefined,
    },
    // ⚠️ 上游解构默认 `variant = 'outlined'`（**不是** Steps 自己的 `'filled'`）
    variant: { type: String as PropType<TimelineProps['variant']>, default: 'outlined' },
    mode: { type: String as PropType<TimelineMode>, default: undefined },
    orientation: { type: String as PropType<TimelineProps['orientation']>, default: 'vertical' },
    titleSpan: {
      type: [String, Number] as PropType<string | number | undefined>,
      default: undefined,
    },
    items: { type: Array as PropType<TimelineItemType[]>, default: undefined },
    // Legacy content data remains valid; richer content uses native item slots.
    pending: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    pendingDot: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    reverse: { type: Boolean, default: false },
  },
  slots: Object as SlotsType<TimelineSlots>,
  setup(props, { attrs, expose, slots }) {
    const config = useComponentConfig<TimelineConfig>('timeline');

    // ---- 判据 1 / 2 / 3 / 4 ----
    const mergedMode = computed(() => mergeMode(props.mode));
    const prefixCls = computed(() => config.getPrefixCls('timeline', props.prefixCls));
    const rootPrefixCls = computed(() => config.getPrefixCls());
    const themeStyle = useTimelineTheme(() => prefixCls.value);
    const rawItems = computed(() =>
      useItems(
        { rootPrefixCls: rootPrefixCls.value, prefixCls: prefixCls.value, mode: mergedMode.value },
        props.items,
        props.pending,
        props.pendingDot,
      ),
    );
    const mergedItems = computed(() =>
      props.reverse ? [...rawItems.value].reverse() : rawItems.value,
    );
    const orientation = computed(() => props.orientation ?? 'vertical');
    // ---- 判据 9：废弃告警（非生产环境）----
    if (import.meta.env?.DEV ?? true) {
      const warning = devUseWarning('Timeline');
      const pendingMessage = 'You can create a `item` as pending node directly.';
      // ⚠️ 本仓的 `deprecated` 是四参 `(valid, oldProp, newProp, message?)`；
      //    上游的三参 `(valid, 'deprecated', message)` 形态由它承载。
      watchEffect(() => {
        warning.deprecated(props.pending === undefined, 'pending', 'items', pendingMessage);
        warning.deprecated(props.pendingDot === undefined, 'pendingDot', 'items', pendingMessage);
        warning.deprecated(
          props.mode !== 'left' && props.mode !== 'right',
          'mode=left|right',
          'mode=start|end',
        );
        for (const [oldProp, newProp] of [
          ['label', 'title'],
          ['children', 'content'],
          ['dot', 'icon'],
          ['position', 'placement'],
        ] as const) {
          warning.deprecated(
            (props.items ?? []).every((item) => item[oldProp] === undefined),
            `items.${oldProp}`,
            `items.${newProp}`,
          );
        }
      });
    }

    // ---- 判据 6：titleSpan → 内联 CSS 变量 ----
    const stepStyle = computed(() => {
      const style: CSSProperties = {};
      if (props.titleSpan !== undefined && mergedMode.value !== 'alternate') {
        const name = typeof props.titleSpan === 'number' ? 'head-span' : 'head-span-ptg';
        style[`--${rootPrefixCls.value}-timeline-${name}`] = props.titleSpan;
      }
      return style;
    });

    provide(stepsInternalContextKey, {
      rootComponent: 'ol',
      itemComponent: 'li',
      get rootAttrs() {
        const { class: _class, style: _style, ...nativeAttrs } = attrs;
        return nativeAttrs;
      },
    });
    provide(stepsUnstableContextKey, {
      get railFollowPrevStatus() {
        return props.reverse;
      },
    });

    // Native attrs must be read in render; useAttrs is not a computed dependency.
    const classString = (alternate: boolean) =>
      normalizeClass([
        prefixCls.value,
        config.className,
        attrs.class,
        orientation.value === 'horizontal' && `${prefixCls.value}-horizontal`,
        alternate && `${prefixCls.value}-layout-alternate`,
        config.direction === 'rtl' && `${prefixCls.value}-rtl`,
        `${prefixCls.value}-css-var`,
      ]);
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TimelineProps,
      TimelineSemanticClassNames,
      TimelineSemanticStyles
    >(
      [() => stepsClassNamesOf(prefixCls.value), () => config.classNames, () => props.classNames],
      [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
      props,
    );

    // ---- ref：Steps 的根元素（本组件没有自己的根）----
    // ⚠️ vnode 在**渲染函数内**创建 ⇒ 带 `ref` 是安全的（PITFALLS 264 说的是
    //    「渲染期之外创建的 vnode 带 ref」会炸）。
    const stepsRef = shallowRef<{ $el?: unknown } | null>(null);
    expose({
      nativeElement: computed(() => {
        // Steps has a numeric `current` prop; resolve its actual root directly.
        const el = getElement(stepsRef.value?.$el);
        return typeof HTMLElement !== 'undefined' && el instanceof HTMLElement ? el : null;
      }),
    });

    return () => {
      // Snapshot native slots in their owner render, once per field and item.
      const items = mergedItems.value.map((entry, index) => {
        const sourceIndex = props.reverse ? mergedItems.value.length - 1 - index : index;
        const item = props.items?.[sourceIndex];
        // The synthetic legacy pending entry has no source item or item-slot scope.
        if (!item) return { ...entry, icon: completeIcon(entry.icon) };
        const scope = { item, index };
        return {
          ...entry,
          title: slots.itemTitle ? slots.itemTitle(scope) : entry.title,
          content: slots.itemContent ? slots.itemContent(scope) : entry.content,
          icon: completeIcon(slots.itemIcon ? slots.itemIcon(scope) : entry.icon),
        };
      });
      const alternate =
        mergedMode.value === 'alternate' ||
        (orientation.value === 'vertical' && items.some((item) => !isEmptyVNode(item.title)));
      const nativeRootStyle = normalizeStyle([
        themeStyle.value,
        mergedStyles.value.root,
        attrs.style,
      ]);
      const styles: TimelineSemanticStyles = {
        ...mergedStyles.value,
        ...(typeof nativeRootStyle === 'object' ? { root: nativeRootStyle } : {}),
      };
      // ⚠️ `Steps` 是**组件** ⇒ children 走插槽路径；但这里不传 children
      //    （`Timeline` 的内容全在 `items` 里）。
      return h(Steps, {
        ref: stepsRef,
        // 判据 8：restProps 透传（`attrs` 承载未声明的 prop）
        //
        // ✅ Steps 已迁移到「根 class 走原生 attrs」（它的 `stepsClassName` 会并入
        //    `attrs.class`，并把 `class` 从 restAttrs 里摘掉）⇒ 这里必须传 **`class`**；
        //    继续传 `className` 会落进 attrs 变成 `classname` 属性、类名静默丢失。
        //    （2026-10-06 迁移 steps 时同步改的 —— 见 registry 里 steps 的迁移提示。）
        class: classString(alternate),
        // ⚠️ 只放 `titleSpan` 的内联变量 —— **用户的 `style` 走 `styles.root`**（见上）
        style: stepStyle.value,
        // 判据 5：八键映射 + 上下文 / 用户的语义化槽（**三路合并**）
        classNames: mergedClassNames.value,
        styles,
        variant: props.variant,
        orientation: orientation.value,
        // Timeline owns its explicit orientation at every viewport width.
        responsive: false,
        // 判据 3 / 4
        type: 'dot',
        items,
        current: items.length - 1,
      });
    };
  },
});

export default Timeline;
