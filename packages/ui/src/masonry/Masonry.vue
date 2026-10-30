<script setup lang="ts" generic="T = unknown">
/** Native Vue masonry: render initial items on the server and progressively
 * replace the measurable grid with absolute shortest-column positioning. */
import { MotionList } from '@apollo-design/motion';
import { isEqual, mergeDomAttrs, observeResize } from '@apollo-design/utils';
import {
  computed,
  normalizeStyle,
  onMounted,
  onScopeDispose,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  watch,
} from 'vue';
import { toCssSize } from '../_internal/to-css-size';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import useGutter from '../grid/hooks/use-gutter';
import { MasonryItem } from './components/MasonryItem';
import { resolveColumnCount } from './hooks/column-count';
import { computeItemPositions, type ItemHeightData } from './hooks/positions';
import { useDelay } from './hooks/use-delay';
import type {
  MasonryEmits,
  MasonryExpose,
  MasonryItemType,
  MasonryLayoutItem,
  MasonryProps,
  MasonrySemanticClassNames,
  MasonrySemanticStyles,
  MasonrySlots,
} from './interface';

defineOptions({
  name: 'AMasonry',
  // Route native attrs explicitly so class/style and internal listeners merge.
  inheritAttrs: false,
});

const props = withDefaults(defineProps<MasonryProps<T>>(), {
  // ⚠️ 可选项一律显式 `undefined`（Boolean prop 未传 ≠ false）
  prefixCls: undefined,
  classNames: undefined,
  styles: undefined,
  columns: undefined,
  fresh: undefined,
  items: undefined,
  onLayoutChange: undefined,
  /** 上游 `gutter = 0`。 */
  gutter: 0,
});

/** 根 `class` / `style` 是 Vue 原生 attrs（上游也把它们挂在根 div 上）。 */
const attrs = useAttrs();

const emit = defineEmits<MasonryEmits<T>>();
const slots = defineSlots<MasonrySlots<T>>();

// ============================== 上下文 ==============================
/** ConfigProvider 的 `components.masonry` 配置（本仓把 antd 的顶层键收在 `components` 下）。 */
interface MasonryConfig {
  className?: string | undefined;
  style?: Record<string, string | number> | undefined;
  classNames?: MasonrySemanticClassNames | undefined;
  styles?: MasonrySemanticStyles | undefined;
}

const context = useComponentConfig<MasonryConfig>('masonry');
const direction = useDirection();

const prefixCls = computed(() => context.getPrefixCls('masonry', props.prefixCls));
const rootPrefixCls = computed(() => context.getPrefixCls());
/** 组件作用域 CSS 变量（上游 `genCssVar(rootPrefixCls, 'masonry')`）。 */
const itemWidthVar = computed(() => `--${rootPrefixCls.value}-masonry-item-width`);

// ============================== 当前数据 ==============================
/**
 * ⚠️ `shallowRef`：item 里的 `data` 是**用户对象**，深度代理既没必要也可能很贵
 * （`reactive` 会递归代理）。上游也只是 `setState(items)`。
 */
const mergedItems = shallowRef<MasonryItemType<T>[]>(props.items ? [...props.items] : []);

/** Track array entries and layout scalars without traversing business data or
 * VNodes. Entry identity matters even when a replacement keeps the same key. */
const itemInputs = () => props.items?.map((item, index) => [item, item.key ?? index, item.column]);

/** Keep a shallow snapshot so in-place push/splice/swap also trigger layout
 * collection (Issue #52), while the caller's item objects keep their identity. */
const syncItems = (): void => {
  mergedItems.value = props.items ? [...props.items] : [];
};

watch(itemInputs, syncItems, { flush: 'sync' });

// ============================== 列数 / 间距 ==============================
const screens = useBreakpoint();
const columnCount = computed(() => resolveColumnCount(props.columns, screens.value));

const gutters = computed(() => useGutter(props.gutter, screens.value));
/** 上游 `const [horizontalGutter = 0, verticalGutter = horizontalGutter] = gutters`。 */
const horizontalGutter = computed(() => gutters.value[0] ?? 0);
const verticalGutter = computed(() => gutters.value[1] ?? gutters.value[0] ?? 0);

/** Pixel height resolved by the browser alongside item measurements. */
const verticalGutterPx = shallowRef(0);

// ============================== 量测 ==============================
const rootEl = ref<HTMLDivElement | null>(null);
defineExpose<MasonryExpose>({ nativeElement: () => rootEl.value });

let gutterContainer: HTMLDivElement | null = null;
let gutterSize: HTMLDivElement | null = null;
let disposeGutterResize: (() => void) | null = null;

const releaseGutterMeasure = (): void => {
  disposeGutterResize?.();
  disposeGutterResize = null;
  gutterContainer?.remove();
  gutterContainer = null;
  gutterSize = null;
};

/** The probe inherits CSS variables and fonts. Its percentage basis is stable:
 * caller height when specified, otherwise current zero-gap intrinsic height. */
const measureGutter = (items: ItemHeightData[]): void => {
  const root = rootEl.value;
  if (!root) return;
  const horizontal = horizontalGutter.value;
  const vertical = verticalGutter.value;
  if (typeof horizontal === 'number' && typeof vertical === 'number') {
    releaseGutterMeasure();
    verticalGutterPx.value = vertical;
    return;
  }

  if (!gutterContainer || !gutterSize) {
    gutterContainer = root.ownerDocument.createElement('div');
    gutterContainer.setAttribute('aria-hidden', 'true');
    Object.assign(gutterContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      visibility: 'hidden',
      pointerEvents: 'none',
      overflow: 'hidden',
      padding: '0',
      border: '0',
    });
    gutterSize = root.ownerDocument.createElement('div');
    Object.assign(gutterSize.style, { margin: '0', padding: '0', border: '0' });
    gutterContainer.append(gutterSize);
    root.append(gutterContainer);
    // Independent font/viewport/CSS-variable changes can resize the gap even
    // when the root width and fixed-height item content remain unchanged.
    disposeGutterResize = observeResize(gutterSize, collectItemSize);
  }

  const callerStyle = normalizeStyle([mergedStyles.value.root, attrs.style]);
  const callerHeight = typeof callerStyle === 'object' ? callerStyle?.height : undefined;
  const basis =
    callerHeight != null && callerHeight !== '' && callerHeight !== 'auto'
      ? root.clientHeight
      : computeItemPositions(items, columnCount.value, 0)[1];
  gutterContainer.style.width = toCssSize(root.clientWidth) ?? '';
  gutterContainer.style.height = toCssSize(basis) ?? '';
  gutterSize.style.width = toCssSize(horizontal) ?? '';
  gutterSize.style.height = toCssSize(vertical) ?? '';
  verticalGutterPx.value =
    typeof vertical === 'number' ? vertical : gutterSize.getBoundingClientRect().height;
};

/** key（原样）→ item 元素。⚠️ 用 `String(key)` 查：槽回传的 key 被 `String()` 化了。 */
const itemEls = new Map<string, HTMLDivElement>();
const setItemRef = (key: string, el: HTMLDivElement | null): void => {
  if (el) {
    itemEls.set(key, el);
    collectItemSize();
  } else {
    itemEls.delete(key);
  }
};

const itemHeights = shallowRef<ItemHeightData[]>([]);

/**
 * 量测所有 item 的高度（raf 去抖）。
 * 组件更新后及以下事件调度测量：
 * ① 挂载 / `mergedItems` / `columnCount` 变化；② 根上的 `ResizeObserver`；
 * ③ 根上的原生 load/error 捕获事件；
 * ④ `fresh` 时每个 item 自己的 `ResizeObserver`。
 */
const collectItemSize = useDelay(() => {
  const next: ItemHeightData[] = [];
  for (const [index, item] of mergedItems.value.entries()) {
    const itemKey = item.key ?? index;
    const el = itemEls.get(String(itemKey));
    // Motion may not have mounted every node yet; never publish zero placeholders.
    if (!el) return;
    next.push([itemKey, el.getBoundingClientRect().height, item.column]);
  }
  measureGutter(next);

  // 上游用 `isEqual` 去重：高度没变就不 setState（防重排循环）
  if (!isEqual(itemHeights.value, next)) {
    itemHeights.value = next;
  }
});

// Measure only after DOM refs exist; setItemRef also covers delayed motion mounts.
onMounted(collectItemSize);
watch([mergedItems, columnCount, horizontalGutter, verticalGutter], collectItemSize, { flush: 'post' });
onUpdated(collectItemSize);

// 根元素尺寸变化 ⇒ 重算（`ResizeObserver` 不产生 DOM，等价于上游包一层）
let disposeRootResize: (() => void) | null = null;

onMounted(() => {
  if (rootEl.value) {
    disposeRootResize = observeResize(rootEl.value, collectItemSize);
  }
});

onScopeDispose(() => {
  disposeRootResize?.();
  releaseGutterMeasure();
});

// ============================== 排布 ==============================
const positionInfo = computed(() =>
  computeItemPositions(itemHeights.value, columnCount.value, verticalGutterPx.value),
);
const itemPositions = computed(() => positionInfo.value[0]);
const totalHeight = computed(() => positionInfo.value[1]);

/** `MotionList` 的 `keys`：key 对象额外携带业务数据（上游 `itemWithPositions` 同构）。 */
const motionKeys = computed(() =>
  mergedItems.value.map((item, index) => {
    const key = item.key ?? index;
    return {
      key,
      item,
      itemIndex: index,
      position: itemPositions.value.get(key),
    };
  }),
);

/** Use normal grid flow until every current item has a measured position. */
const layoutReady = computed(() =>
  motionKeys.value.every(({ position }) => position !== undefined),
);

/** Evaluate slots in their owner render. MotionList retains each key's content
 * and position until leave completes, so removed data needs no permanent cache. */
const renderKeys = () =>
  motionKeys.value.map((entry) => ({
    ...entry,
    content: slots.item
      ? slots.item({
          ...entry.item,
          index: entry.itemIndex,
          column: entry.position?.column ?? 0,
        })
      : entry.item.children,
  }));

// ============================== onLayoutChange ==============================
/** Last published complete layout, for event deduplication. */
let itemColumns: readonly [MasonryItemType<T>, number][] = [];

/** Publish only complete measured layouts, independently of listener syntax. */
const collectLayout = (): void => {
  const next = motionKeys.value;
  if (!next.every(({ position }) => position)) return;

  const mapped = next.map<[MasonryItemType<T>, number]>(({ item, position }) => [
    item,
    position?.column ?? 0,
  ]);
  if (!isEqual(itemColumns, mapped)) {
    itemColumns = mapped;
    const sortInfo: MasonryLayoutItem<T>[] = mapped.map(([item, column]) => ({
      ...item,
      column,
    }));
    // Vue delivers normal and once listeners; never call the prop separately.
    emit('layoutChange', sortInfo);
  }
};

onMounted(collectLayout);
watch(motionKeys, collectLayout, { flush: 'post' });

// ============================== 语义化 ==============================
/** Semantic callbacks read the current props and resolved column count. */
const semanticProps = computed<MasonryProps<T>>(() => ({ ...props, columns: columnCount.value }));

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  MasonryProps<T>,
  MasonrySemanticClassNames,
  MasonrySemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
  semanticProps,
);

// ============================== 类名 / 根样式 ==============================
const rootClassNames = () => [
  prefixCls.value,
  context.className,
  mergedClassNames.value.root,
  // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
  attrs.class,
  // 本仓无 hashId（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）
  `${prefixCls.value}-css-var`,
  direction.value === 'rtl' ? `${prefixCls.value}-rtl` : undefined,
];

/** SSR and pre-measurement content stays in flow with a natural container height. */
const rootStyle = computed(() => ({
  ...(layoutReady.value
    ? { height: toCssSize(totalHeight.value) }
    : {
        display: 'grid',
        alignItems: 'start',
        gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`,
        columnGap: toCssSize(horizontalGutter.value),
        rowGap: toCssSize(verticalGutter.value),
      }),
  ...mergedStyles.value.root,
}));

/** Read attrs during render; useAttrs is not a computed dependency. */
const rootDomAttrs = () => {
  const { class: _class, style, ...nativeAttrs } = attrs;
  return mergeDomAttrs(nativeAttrs, {
    class: rootClassNames(),
    style: normalizeStyle([rootStyle.value, style]),
  });
};

/** `fresh` 时每个 item 各挂一个观察者；否则不挂（上游传 `null`，本仓用 `undefined`）。 */
const itemResize = computed(() => (props.fresh ? collectItemSize : undefined));
</script>

<template>
  <div
    ref="rootEl"
    v-bind="rootDomAttrs()"
    @load.capture="collectItemSize"
    @error.capture="collectItemSize"
  >
    <MotionList
      :keys="renderKeys()"
      :component="false"
      :motion-name="`${prefixCls}-item-fade`"
      motion-appear
      motion-leave
    >
      <template #default="slot">
        <MasonryItem
          :prefix-cls="prefixCls"
          :measured="layoutReady"
          :item-key="slot.itemKey"
          :column-index="slot.position?.column ?? 0"
          :top="slot.position?.top"
          :motion-class-name="slot.className"
          :motion-style="slot.style"
          :item-class-name="mergedClassNames.item"
          :item-style="mergedStyles.item"
          :content="slot.content"
          :column-count="columnCount"
          :horizontal-gutter="horizontalGutter"
          :item-width-var="itemWidthVar"
          :set-item-ref="setItemRef"
          :on-resize="itemResize"
        />
      </template>
    </MotionList>
  </div>
</template>
