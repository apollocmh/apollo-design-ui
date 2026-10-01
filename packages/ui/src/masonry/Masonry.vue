<script setup lang="ts">
/**
 * Masonry —— 瀑布流。对应 antd 6.6.4 的 `es/masonry/`。
 *
 * 契约全文见 `docs/analysis/masonry.md`（G1 产物）；下面只留**实现期最容易写错的判据**。
 *
 * ── 三条必须复刻的上游行为 ──────────────────────────────────────────────────
 *
 * 1. 🚨 **`mergedItems` 的一拍延迟**（`Masonry.tsx:120-124`）：上游用
 *    `useState([]) + useEffect` ⇒ **首帧渲染空列表**，第二帧才有 item。
 *    本仓用 `onMounted` + `watch(flush:'post')` 卡同一个时机。
 *    ⚠️ 不能用 `watch(..., { immediate: true })`（那是 `setup` 期同步跑 ⇒ 少一拍）。
 * 2. 🚨 **根 div 的 `onLoad` / `onError` 照抄**（`Masonry.tsx:250-252`）——
 *    实测这两条**是死监听**（React 把 `load` 当非委托事件直接绑在该元素上、冒泡阶段，
 *    而 `load` 不冒泡 ⇒ 子 `<img>` 的事件到不了根 div）。本仓同样绑在冒泡阶段，
 *    **不要**改成 `onLoadCapture`（理由见分析文档 §6.1）。
 * 3. **排布算法**在 `hooks/positions.ts`（纯函数，三处易错点写在文件头）。
 *
 * ── 本仓的三处平台差异 ───────────────────────────────────────────────────────
 *
 * - `useLayoutEffect` → `onMounted` + `watch(flush:'post')`（DOM 无响应式，PITFALLS 211）。
 * - `genCssVar(root,'masonry')` → 手写 `--{rootPrefixCls}-masonry-item-width`。
 * - `useCSSVarCls` → 根类名里直接拼 `${prefixCls}-css-var`。
 * - `CSSMotionList` 的 render-prop → `MotionList` 的默认插槽（载荷含 key 对象的
 *   其余字段 + `itemKey` + `index`，见 `packages/motion/src/motion-list.ts`）。
 */
import { MotionList } from '@apollo-design/motion';
import { isEqual, observeResize } from '@apollo-design/utils';
import { computed, onMounted, onScopeDispose, ref, shallowRef, type VNodeChild, watch } from 'vue';
import { toCssSize } from '../_internal/to-css-size';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import useGutter from '../grid/hooks/use-gutter';
import { DEFAULT_ITEM_LAYOUT, MasonryItem, type MasonryItemLayout } from './components/MasonryItem';
import { resolveColumnCount } from './hooks/column-count';
import { computeItemPositions, type ItemHeightData } from './hooks/positions';
import { useDelay } from './hooks/use-delay';
import type {
  MasonryEmits,
  MasonryItemType,
  MasonryKey,
  MasonryLayoutItem,
  MasonryProps,
  MasonrySemanticClassNames,
  MasonrySemanticStyles,
} from './interface';

defineOptions({
  name: 'AMasonry',
  /**
   * 🚨 上游**不透传** `...restProps`（`Masonry.tsx:237-253` 的 div 只挂了
   * `ref` / `className` / `style` / `onLoad` / `onError`）—— React 里没显式传的
   * prop 不会落到 DOM 上。Vue 默认会把 `attrs` 全绑到根元素 ⇒ 必须关掉，
   * 否则 `<Masonry data-x="1">` 会多出 `data-x`（Skeleton 同判，PITFALLS 181）。
   */
  inheritAttrs: false,
});

const props = withDefaults(defineProps<MasonryProps>(), {
  // ⚠️ 可选项一律显式 `undefined`（Boolean prop 未传 ≠ false）
  prefixCls: undefined,
  className: undefined,
  rootClassName: undefined,
  style: undefined,
  classNames: undefined,
  styles: undefined,
  columns: undefined,
  fresh: undefined,
  items: undefined,
  itemRender: undefined,
  onLayoutChange: undefined,
  /** 上游 `gutter = 0`。 */
  gutter: 0,
});

const emit = defineEmits<MasonryEmits>();

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

// ============================== 数据（一拍延迟） ==============================
/**
 * ⚠️ `shallowRef`：item 里的 `data` 是**用户对象**，深度代理既没必要也可能很贵
 * （`reactive` 会递归代理）。上游也只是 `setState(items)`。
 */
const mergedItems = shallowRef<MasonryItemType[]>([]);

onMounted(() => {
  mergedItems.value = props.items ?? [];
});

// 见文件头第 1 条：`flush: 'post'` 复刻 `useEffect` 的「commit 之后」
watch(
  () => props.items,
  (next) => {
    mergedItems.value = next ?? [];
  },
  { flush: 'post' },
);

// ============================== 列数 / 间距 ==============================
const screens = useBreakpoint();
const columnCount = computed(() => resolveColumnCount(props.columns, screens.value));

const gutters = computed(() => useGutter(props.gutter, screens.value));
/** 上游 `const [horizontalGutter = 0, verticalGutter = horizontalGutter] = gutters`。 */
const horizontalGutter = computed(() => gutters.value[0] ?? 0);
const verticalGutter = computed(() => gutters.value[1] ?? gutters.value[0] ?? 0);

/**
 * 纵向间距的**数值**形态。
 *
 * 🚨 上游写的是 `usePositions(itemHeights, columnCount, verticalGutter as number)` ——
 * 一个不安全的断言。`Gutter` 类型允许 `string`（antd 的 grid 也这么定），
 * 而 `usePositions` 里是**算术**：`columnHeights[t] += height + verticalGutter`。
 * 传 `'16'` 时上游会退化成字符串拼接（`150 + '16'` ⇒ `'15016'`）⇒ `totalHeight` 变 `NaN`。
 *
 * 本仓把这条**未定义行为**收敛成「能转成有限数就用，否则 0」，登记为差异 **D10**。
 * 数字输入（正常用法）两边完全一致。
 */
const verticalGutterPx = computed<number>(() => {
  const value = verticalGutter.value;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
});

// ============================== 量测 ==============================
/** key（原样）→ item 元素。⚠️ 用 `String(key)` 查：槽回传的 key 被 `String()` 化了。 */
const itemEls = new Map<string, HTMLDivElement | null>();
const setItemRef = (key: string, el: HTMLDivElement | null): void => {
  itemEls.set(key, el);
};

const itemHeights = shallowRef<ItemHeightData[]>([]);

/**
 * 量测所有 item 的高度（raf 去抖）。
 * 触发点四处（与上游 `collectItemSize` 的调用点一一对应）：
 * ① 挂载 / `mergedItems` / `columnCount` 变化；② 根上的 `ResizeObserver`；
 * ③ 根 div 的 `load` / `error`（**死监听**，见文件头第 2 条）；
 * ④ `fresh` 时每个 item 自己的 `ResizeObserver`。
 */
const collectItemSize = useDelay(() => {
  const next = mergedItems.value.map<ItemHeightData>((item, index) => {
    const itemKey = item.key ?? index;
    const rect = itemEls.get(String(itemKey))?.getBoundingClientRect();
    return [itemKey, rect ? rect.height : 0, item.column];
  });

  // 上游用 `isEqual` 去重：高度没变就不 setState（防重排循环）
  if (!isEqual(itemHeights.value, next)) {
    itemHeights.value = next;
  }
});

/**
 * ⚠️ **不要额外加 `onMounted(collectItemSize)`**。
 *
 * 上游的 `useEffect(collectItemSize, [mergedItems, columnCount])` 在挂载时也会跑一次，
 * 但那时 `mergedItems` 还是 `[]` ⇒ 量到空数组 ⇒ `isEqual([], [])` 直接短路，**是个空转**。
 *
 * 本仓如果照抄成 `onMounted(collectItemSize)`，它会跑在**同一个 `onMounted` 里
 * 刚赋完值的 `mergedItems` 之后、而 DOM 还没重渲染**的位置 ⇒ 量到 15 个「元素不存在 ⇒
 * 高度 0」⇒ 算出一版**全 0 列号**的位置并写进 `itemColumns` ⇒ **`layoutChange` 会先发
 * 一次错的、再发一次对的**（2026-10-01 L2 实测抓到）。
 *
 * 下面这个 `flush: 'post'` 的 watcher 已经覆盖了首次量测：`mergedItems` 由 `[]` 变非空
 * 本身就是一次变化 ⇒ 重渲染之后触发 ⇒ 那时 DOM 已就绪 ✓。
 */
watch([mergedItems, columnCount], collectItemSize, { flush: 'post' });

// 根元素尺寸变化 ⇒ 重算（`ResizeObserver` 不产生 DOM，等价于上游包一层）
const rootEl = ref<HTMLDivElement | null>(null);
let disposeRootResize: (() => void) | null = null;

onMounted(() => {
  if (rootEl.value) {
    disposeRootResize = observeResize(rootEl.value, collectItemSize);
  }
});

onScopeDispose(() => {
  disposeRootResize?.();
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

/**
 * key（`String()` 化）→ **最近一次**的渲染数据。
 *
 * 🚨 **粘性表：只写不删。** 离场中的 item 已经不在 `items` 里了，但它的淡出动画
 * 还要跑 —— 那时 `itemContent()` 必须还能拿到内容与布局。
 * 上游靠 `diffKeys` 保留的 key 对象达到同一效果（`MotionList` 现在也会把 key 对象的
 * 其余字段透传给插槽，但插槽载荷是无类型的，所以本仓在**父组件**按 key 查表，
 * 好处是 `itemRender` 的调用点是**有类型**的）。
 */
interface MasonryRenderEntry {
  item: MasonryItemType;
  itemIndex: number;
  layout: MasonryItemLayout;
}

const entryByKey = new Map<string, MasonryRenderEntry>();

watch(
  motionKeys,
  (next) => {
    for (const { key, item, itemIndex, position } of next) {
      entryByKey.set(String(key), {
        item,
        itemIndex,
        layout: { columnIndex: position?.column ?? 0, top: position?.top },
      });
    }
  },
  // `sync`：必须在**消费它的那次渲染之前**把表刷好（表本身不是响应式的）
  { immediate: true, flush: 'sync' },
);

/** 按 key 取布局；缺省 = 上游 `position = {}` 的等价形态。 */
const layoutOf = (itemKey: string): MasonryItemLayout =>
  entryByKey.get(itemKey)?.layout ?? DEFAULT_ITEM_LAYOUT;

/** 按 key 渲染内容：`item.children ?? itemRender({...item, index, column})`。 */
const itemContent = (itemKey: string): VNodeChild => {
  const entry = entryByKey.get(itemKey);
  if (!entry) return undefined;
  const { item, itemIndex, layout } = entry;
  return (
    item.children ??
    props.itemRender?.({
      ...item,
      index: itemIndex,
      column: layout.columnIndex,
    })
  );
};

// ============================== onLayoutChange ==============================
/** 已排布的 `[item, column]`（上游 `itemColumns`）。 */
const itemColumns = shallowRef<readonly [MasonryItemType, number][]>([]);

/** 上游第一段 `useLayoutEffect`：全部有位置时写 `itemColumns`（`isEqual` 去重）。 */
const collectLayout = (): void => {
  if (!props.onLayoutChange) return;
  const next = motionKeys.value;
  if (!next.every(({ position }) => position)) return;

  const mapped = next.map<[MasonryItemType, number]>(({ item, position }) => [
    item,
    position?.column ?? 0,
  ]);
  if (!isEqual(itemColumns.value, mapped)) {
    itemColumns.value = mapped;
  }
};

onMounted(collectLayout);
watch(motionKeys, collectLayout, { flush: 'post' });

/** 上游第二段：`itemColumns` 变化且长度与 `items` 一致时回调。 */
watch(
  itemColumns,
  () => {
    if (!props.onLayoutChange) return;
    if (!props.items || props.items.length !== itemColumns.value.length) return;

    const sortInfo = itemColumns.value.map(([item, column]) => ({
      ...item,
      column,
    })) as MasonryLayoutItem[];
    /**
     * ⚠️ **只 `emit`，不要额外再调 `props.onLayoutChange`。**
     *
     * Vue 的 `emit('layoutChange')` 自己就会去找 `props.onLayoutChange` 并调用它
     * （`toHandlerKey(event)` 的映射）⇒ 再手写一遍就是**两次**。
     * 2026-10-01 L2 实测抓到（`onLayoutChange` 被调 2 次而 `emitted` 只有 1 条）。
     *
     * 这一条 emit 同时满足两种写法：`<Masonry @layout-change>` 与 `:on-layout-change`。
     * ⚠️ splitter 的 `props.onResize?.(x); emit('resize', x)` 是同一形态 ——
     * 若 `onResize` 被 Vue 认作 `resize` 的处理器，那里就是同一个重复调用。
     */
    emit('layoutChange', sortInfo);
  },
  { flush: 'post' },
);

// ============================== 语义化 ==============================
/**
 * ⚠️ 与 Spin / Result 同法：`useMergeSemantic` 在 `setup` 期捕获 props 对象，
 * 所以这里传一个**身份稳定、内容会变**的普通对象（函数式变体读到的 `props.columns`
 * 必须是**解析后的列数** —— 上游传的是 `mergedProps = {...props, columns: columnCount}`）。
 */
const semanticProps: MasonryProps = { ...props };

watch(
  [() => props.columns, columnCount],
  () => {
    Object.assign(semanticProps, props, { columns: columnCount.value });
  },
  { immediate: true, flush: 'sync' },
);

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  MasonryProps,
  MasonrySemanticClassNames,
  MasonrySemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [
    () => context.styles,
    () => semanticRootStyle(context.style),
    () => props.styles,
    () => semanticRootStyle(props.style),
  ],
  semanticProps,
);

// ============================== 类名 / 根样式 ==============================
const rootClassNames = computed(() => [
  prefixCls.value,
  context.className,
  mergedClassNames.value.root,
  props.rootClassName,
  props.className,
  // 本仓无 hashId（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）
  `${prefixCls.value}-css-var`,
  direction.value === 'rtl' ? `${prefixCls.value}-rtl` : undefined,
]);

const rootStyle = computed(() => ({
  // 🚨 数字必须过 toCssSize（Vue 的 patchStyle 不补 px）
  height: toCssSize(totalHeight.value),
  ...mergedStyles.value.root,
}));

/** `fresh` 时每个 item 各挂一个观察者；否则不挂（上游传 `null`，本仓用 `undefined`）。 */
const itemResize = computed(() => (props.fresh ? collectItemSize : undefined));
</script>

<template>
  <div
    ref="rootEl"
    :class="rootClassNames"
    :style="rootStyle"
    @load="collectItemSize"
    @error="collectItemSize"
  >
    <MotionList
      :keys="motionKeys"
      :component="false"
      :motion-name="`${prefixCls}-item-fade`"
      motion-appear
      motion-leave
    >
      <template #default="slot">
        <MasonryItem
          :prefix-cls="prefixCls"
          :item-key="slot.itemKey"
          :column-index="layoutOf(slot.itemKey).columnIndex"
          :top="layoutOf(slot.itemKey).top"
          :motion-class-name="slot.className"
          :motion-style="slot.style"
          :item-class-name="mergedClassNames.item"
          :item-style="mergedStyles.item"
          :content="itemContent(slot.itemKey)"
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
