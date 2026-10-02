/**
 * `Timeline` —— 时间轴。对应 antd 6.6.4 的 `es/timeline/Timeline.tsx`（303 行）。
 *
 * ── 🚨 本组件是 `Steps` 的**薄壳**（没有自己的 DOM）────────────────────────────
 *
 * 渲染体只有一个 `<Steps>`：
 *
 * ```jsx
 * <InternalContext.Provider value={{ rootComponent: 'ol', itemComponent: 'li' }}>
 *   <UnstableContext.Provider value={{ railFollowPrevStatus: reverse }}>
 *     <Steps type="dot" orientation items current={items.length - 1} classNames={…} />
 *   </UnstableContext.Provider>
 * </InternalContext.Provider>
 * ```
 *
 * 「时间轴」的观感全部来自：`type="dot"` + 一层 **classNames 映射**
 * （把 Steps 的 `-item-*` 换成 `timeline-*` 前缀）+ `Timeline` 自己的样式表
 * （大量覆盖 Steps 的 `--{p}-cmp-steps-*` 中间变量）。
 *
 * ── 十条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **`mergedMode`**：`'left' → 'start'`、`'right' → 'end'`；否则
 *    `['alternate','start','end'].includes(mode) ? mode : 'start'`（**默认 `'start'`**）。
 * 2. **`reverse`** ⇒ `[...items].reverse()`（在 `useItems` **之后**）。
 * 3. **`layoutAlternate`** = `mergedMode === 'alternate' ||
 *    (orientation === 'vertical' && items.some(i => i.title))` ⇒ 根类 `-layout-alternate`。
 * 4. **`current = items.length - 1`**（最后一项 active）。
 * 5. **`classNames` 的八键映射**（`item` / `itemTitle` / `itemIcon` / `itemContent` /
 *    `itemRail` / `itemWrapper` / `itemSection` / `itemHeader`）全部指向 `timeline` 前缀。
 * 6. **`titleSpan`**：`isNonNullable(titleSpan) && mode !== 'alternate'` 时写内联变量
 *    —— 数字 ⇒ `--{root}-timeline-head-span`；字符串 ⇒ `-head-span-ptg`。
 * 7. **`classString` 的顺序**：`prefixCls` → `contextClassName` → `className` →
 *    `-horizontal`（仅横向）→ `-layout-alternate` → `-rtl` → `cssVarCls`。
 * 8. **`restProps` 全量透传给 `Steps`**。
 * 9. **废弃告警 7 条**（见下方）。
 * 10. **`Timeline.Item` 是空壳**（上游 `(() => {})`）—— 只为「用了就告警」而存在。
 *
 * ── 🚨 三条平台差异（PLATFORM）────────────────────────────────────────────────
 *
 * - **两个 Context 走 `provide`**：本仓的 `steps` 已按上游结构加了
 *   `stepsInternalContextKey` / `stepsUnstableContextKey`（见 `steps/context.ts`）。
 *   ⚠️ 它们**不是** `stepsIconContextKey` —— 后者由 `Steps` 自己 provide，
 *   外层 provide 会被「最近的赢」遮蔽（PITFALLS 256）；本仓让 `Steps` **接住并转发**。
 * - **`children` 形态不支持**（上游读 `element.props`，Vue 插槽没有这个语义）
 *   ⇒ 只支持 `items`（`Timeline.Item` 本就是空壳）。
 * - **`ref`**：上游没有 ref（没有自己的根）；本仓暴露 `{ nativeElement }`
 *   = **Steps 的根元素**（`ol` 或 `div`）。
 */

import { devUseWarning, isNonNullable, isNumber } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { Steps } from '../steps';
import { stepsInternalContextKey, stepsUnstableContextKey } from '../steps/context';
import type { StepItem } from '../steps/interface';
import type {
  TimelineConfig,
  TimelineItemType,
  TimelineMode,
  TimelineProps,
  TimelineSemanticClassNames,
  TimelineSemanticStyles,
} from './interface';
import { useItems } from './use-items';

/** 两个内部的 Steps Context 值（与上游逐字一致）。 */
const STEP_INTERNAL_CONTEXT = { rootComponent: 'ol', itemComponent: 'li' };

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
  const modeList = ['alternate', 'start', 'end'];
  return (modeList.includes(mode as string) ? mode : 'start') as TimelineMode;
}

const Timeline = defineComponent({
  name: 'ATimeline',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<TimelineProps['style']>, default: undefined },
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
    // ⚠️ `pending` / `pendingDot` 是**上游的废弃 prop**（VNodeChild）—— 保留 prop 形态
    //    （与 card 的 `title` / `extra` 同判；它们不是插槽语义，是「内容」）
    pending: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    pendingDot: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    reverse: { type: Boolean, default: false },
  },
  setup(props, { attrs, expose }) {
    const {
      getPrefixCls,
      direction,
      className: contextClassName,
      style: contextStyle,
      classNames: contextClassNames,
      styles: contextStyles,
    } = useComponentConfig<TimelineConfig>('timeline');

    // ---- 判据 1 / 2 / 3 / 4 ----
    const mergedMode = mergeMode(props.mode);
    const prefixCls = getPrefixCls('timeline', props.prefixCls);
    const rootPrefixCls = getPrefixCls();

    const rawItems = useItems(
      { rootPrefixCls, prefixCls, mode: mergedMode },
      props.items,
      props.pending,
      props.pendingDot,
    );
    const mergedItems = props.reverse ? [...rawItems].reverse() : rawItems;

    const orientation = props.orientation ?? 'vertical';
    const layoutAlternate =
      mergedMode === 'alternate' ||
      (orientation === 'vertical' && mergedItems.some((item) => item.title));

    // ---- 判据 9：废弃告警（非生产环境）----
    if (import.meta.env?.DEV ?? true) {
      const warning = devUseWarning('Timeline');
      const pendingMessage = 'You can create a `item` as pending node directly.';
      // ⚠️ 本仓的 `deprecated` 是四参 `(valid, oldProp, newProp, message?)`；
      //    上游的三参 `(valid, 'deprecated', message)` 形态由它承载。
      warning.deprecated(props.items === undefined, 'Timeline.Item', 'items');
      warning.deprecated(!props.pending, 'pending', 'items', pendingMessage);
      warning.deprecated(!props.pendingDot, 'pendingDot', 'items', pendingMessage);
      warning.deprecated(
        props.mode !== 'left' && props.mode !== 'right',
        'mode=left|right',
        'mode=start|end',
      );
      // 🚨 逐项四项：判据是 `items.every(item => !item[oldProp])` ——
      //    **只要有一项**用了旧 prop 就**不**告警。
      const warnItems = props.items ?? [];
      for (const [oldProp, newProp] of [
        ['label', 'title'],
        ['children', 'content'],
        ['dot', 'icon'],
        ['position', 'placement'],
      ] as const) {
        warning.deprecated(
          warnItems.every((item) => !item[oldProp]),
          `items.${oldProp}`,
          `items.${newProp}`,
        );
      }
    }

    // ---- 判据 6：titleSpan → 内联 CSS 变量 ----
    const stepStyle: Record<string, string | number> = {};
    if (isNonNullable(props.titleSpan) && mergedMode !== 'alternate') {
      if (isNumber(props.titleSpan)) {
        stepStyle[`--${rootPrefixCls}-timeline-head-span`] = props.titleSpan;
      } else {
        stepStyle[`--${rootPrefixCls}-timeline-head-span-ptg`] = props.titleSpan as string;
      }
    }

    // ---- 两个内部 Context：由 Steps 接住并转发（见文件头）----
    provide(stepsInternalContextKey, STEP_INTERNAL_CONTEXT);
    provide(stepsUnstableContextKey, { railFollowPrevStatus: props.reverse });

    // ---- 判据 7：classString ----
    const cssVarCls = `${prefixCls}-css-var`;
    const classString = [
      prefixCls,
      contextClassName,
      props.className,
      orientation === 'horizontal' ? `${prefixCls}-horizontal` : '',
      layoutAlternate ? `${prefixCls}-layout-alternate` : '',
      direction === 'rtl' ? `${prefixCls}-rtl` : '',
      props.rootClassName,
      cssVarCls,
    ]
      .filter(Boolean)
      .join(' ');

    const stepsClassNames = stepsClassNamesOf(prefixCls);

    // ---- 语义化槽的三路合并（判据 5）----
    //
    // 🚨 两处**必须**照上游：
    //   1. `classNames` 是**拼接**不是替换（上游 `useMergeSemantic` 的 `mergeClassNames`
    //      内部是 `clsx(prev, cur)`）⇒ 写成 `{...base, ...user}` 会让用户的 `classNames.item`
    //      **盖掉** `apollo-timeline-item`（L4 契约实测：8 条差异）。
    //   2. **用户的 `style` 不走 `style` prop，而是走 `styles.root` 语义槽**
    //      （上游 `useSemanticRootStyle(style)`）⇒ 本仓对应 `semanticRootStyle`。
    //      直接塞进 `style` 会被 Steps 的 `rootStyle` 覆盖（L4 实测：整条 style 丢失）。
    const styleRoot = semanticRootStyle(props.style);
    const contextStyleRoot = semanticRootStyle(contextStyle);
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TimelineProps,
      TimelineSemanticClassNames,
      TimelineSemanticStyles
    >(
      [stepsClassNames, () => contextClassNames, () => props.classNames],
      [() => contextStyles, contextStyleRoot, () => props.styles, styleRoot],
      props,
    );

    // ---- ref：Steps 的根元素（本组件没有自己的根）----
    // ⚠️ vnode 在**渲染函数内**创建 ⇒ 带 `ref` 是安全的（PITFALLS 264 说的是
    //    「渲染期之外创建的 vnode 带 ref」会炸）。
    const stepsRef = shallowRef<{ $el?: unknown } | null>(null);
    expose({
      nativeElement: computed(() => (stepsRef.value?.$el as HTMLElement | undefined) ?? null),
    });

    return () => {
      // ⚠️ `Steps` 是**组件** ⇒ children 走插槽路径；但这里不传 children
      //    （`Timeline` 的内容全在 `items` 里）。
      return h(Steps, {
        ...attrs,
        ref: stepsRef,
        // 判据 8：restProps 透传（`attrs` 承载未声明的 prop）
        //
        // 🚨 **必须传 `className` 而不是 `class`** —— 本仓 `Steps.ts` 的渲染是
        //    `const { class: _attrsClass, ...restAttrs } = attrs;`，即它**主动剥掉**
        //    落到 attrs 里的 `class`（自己的根类名由 `stepsClassName` 算），
        //    只把 **`className` prop** 并进去。传 `class` 会被**静默丢弃**。
        className: classString,
        // ⚠️ 只放 `titleSpan` 的内联变量 —— **用户的 `style` 走 `styles.root`**（见上）
        style: stepStyle,
        // 判据 5：八键映射 + 上下文 / 用户的语义化槽（**三路合并**）
        classNames: mergedClassNames.value,
        styles: mergedStyles.value,
        variant: props.variant,
        orientation,
        // 判据 3 / 4
        type: 'dot',
        items: mergedItems as StepItem[],
        current: mergedItems.length - 1,
      });
    };
  },
});

/** `Timeline.Item` 是**空壳**（判据 10）—— 只为「用了就发废弃告警」而存在。 */
const TimelineItem = defineComponent({
  name: 'ATimelineItem',
  setup() {
    return () => null;
  },
});

export default Timeline;
export { TimelineItem };
