<script setup lang="ts" generic="T = unknown">
import { devUseWarning, getElement, isHTMLElement, useResizeObserver } from '@apollo-design/utils';
import {
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
  ref,
  toRaw,
  useAttrs,
  type VNode,
  watch,
} from 'vue';
import { Filler } from './filler';
import { singleItemVNode } from './item-vnode';
import {
  computeRange,
  isInVirtual,
  keepInHorizontalRange,
  keepInRange,
  shouldUseVirtual,
  sumHeights,
} from './range';
import {
  computeScrollTarget,
  MAX_SCROLL_TO_TIMES,
  normalizeScrollArg,
  resolveScrollOffset,
} from './scroll-target';
import { createSizeGetter } from './size';
import type {
  ExtraRenderInfo,
  FillerExposed,
  GetSize,
  ItemKey,
  ScrollInfo,
  ScrollTo,
  SizeInfo,
  VirtualListEmits,
  VirtualListProps,
  VirtualListSlots,
} from './types';
import { useHeights } from './use-heights';

defineOptions({ name: 'AVirtualList', inheritAttrs: false });
const props = withDefaults(
  defineProps<Omit<VirtualListProps<T>, 'onScroll' | 'onVirtualScroll' | 'onVisibleChange'>>(),
  {
    prefixCls: 'apollo-virtual-list',
    data: () => [],
    fullHeight: true,
    virtual: undefined,
    component: 'div',
  },
);
const slots = defineSlots<VirtualListSlots<T>>();
const emit = defineEmits<VirtualListEmits<T>>();
const attrs = useAttrs();
const Content = ({ node }: { node: VNode }) => node;
const containerRef = ref<HTMLElement | null>(null);
const holderRef = ref<HTMLElement | null>(null);
let holderInstance: Element | ComponentPublicInstance | null = null;
const syncHolder = (): void => {
  const root: unknown =
    holderInstance && '$el' in holderInstance ? holderInstance.$el : holderInstance;
  const element = getElement(root);
  const next = isHTMLElement(element) ? element : null;
  if (next === holderRef.value) return;
  holderRef.value = next;
  if (next) {
    next.scrollTop = offsetTop.value;
    next.scrollLeft = isRTL.value ? -offsetLeft.value : offsetLeft.value;
  }
};
const setHolder = (instance: Element | ComponentPublicInstance | null): void => {
  holderInstance = instance;
  syncHolder();
};
const fillerRef = ref<FillerExposed | null>(null);

const offsetTop = ref(0);
const offsetLeft = ref(0);
const size = ref<SizeInfo>({ width: 0, height: props.height ?? 0 });
const innerHeight = ref(0);

// ============================ Item Key ============================
const getKey = (item: T): ItemKey => {
  const value = typeof props.itemKey === 'function' ? props.itemKey(item) : item[props.itemKey];
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError('VirtualList itemKey must resolve to a string or number');
  }
  return value;
};

// ============================= Height =============================
const heightsState = useHeights<ItemKey>((key) => key);
const { heights, updatedMark } = heightsState;

const isRTL = computed(() => props.direction === 'rtl');

const useVirtual = computed(() => shouldUseVirtual(props.virtual, props.height, props.itemHeight));

/** 已测量高度的总和（上游 `containerHeight`）。依赖 `updatedMark` 才是响应式的 */
const containerHeight = computed(() => {
  void updatedMark.value;
  void heights.id;
  return sumHeights(heights.maps);
});

const inVirtual = computed(() =>
  isInVirtual(
    useVirtual.value,
    props.data.length,
    props.itemHeight ?? 0,
    containerHeight.value,
    props.height ?? 0,
    props.scrollWidth,
  ),
);

const range = computed(() => {
  // 依赖清单与上游 useMemo 的 deps 对齐（`heights.id` 用 updatedMark 代替 —— 见 use-heights.ts）
  void updatedMark.value;
  void heights.id;
  return computeRange<T>({
    data: props.data,
    getKey,
    heights,
    itemHeight: props.itemHeight ?? 0,
    height: props.height ?? 0,
    offsetTop: offsetTop.value,
    useVirtual: useVirtual.value,
    inVirtual: inVirtual.value,
    measuredInnerHeight: innerHeight.value,
  });
});

const scrollHeight = computed(() => range.value.scrollHeight);
const fillerOffset = computed(() => range.value.offset);

const maxScrollHeight = computed(() =>
  props.height === undefined
    ? Number.NaN
    : Math.max(0, (scrollHeight.value ?? innerHeight.value) - props.height),
);

// ============================== Size ==============================
useResizeObserver({
  target: holderRef,
  onResize: (info) => {
    size.value = {
      width: holderRef.value?.clientWidth ?? info.offsetWidth,
      height: info.offsetHeight,
    };
  },
});

// ============================== Scroll ============================
const syncScrollTop = (newTop: number | ((origin: number) => number)): void => {
  const value = typeof newTop === 'function' ? newTop(offsetTop.value) : newTop;
  const aligned = keepInRange(value, maxScrollHeight.value);
  if (holderRef.value) {
    holderRef.value.scrollTop = aligned;
    offsetTop.value = holderRef.value.scrollTop;
  } else offsetTop.value = aligned;
};

const getScrollInfo = (): ScrollInfo => ({
  x: isRTL.value ? -offsetLeft.value : offsetLeft.value,
  y: offsetTop.value,
});

let lastVirtualScrollInfo = getScrollInfo();
const triggerScroll = (): void => {
  const next = getScrollInfo();
  if (lastVirtualScrollInfo.x !== next.x || lastVirtualScrollInfo.y !== next.y) {
    emit('virtualScroll', next);
    lastVirtualScrollInfo = next;
  }
};

watch([offsetTop, offsetLeft, isRTL], triggerScroll, { flush: 'post' });
const onFallbackScroll = (event: Event): void => {
  const holder = holderRef.value;
  if (!holder) return;
  if (holder.scrollTop !== offsetTop.value) {
    syncScrollTop(holder.scrollTop);
  }
  // ⚠️ 与上游的差异：上游的横向偏移由它自己的滚轮处理驱动；
  //    我们用原生横向滚动，所以从 scrollLeft 读。
  const logicalLeft = isRTL.value ? -holder.scrollLeft : holder.scrollLeft;
  if (logicalLeft !== offsetLeft.value) offsetLeft.value = logicalLeft;
  emit('scroll', event);
  triggerScroll();
};

// ===================== 滚动同步修正（List.js:188-208） =====================
// 「向上滚动时首项真实高度 ≠ itemHeight 导致跳动」的补偿。
watch(
  scrollHeight,
  () => {
    const changedRecord = heights.getRecord();
    if (changedRecord.size === 1) {
      const recordKey = [...changedRecord.keys()][0];
      const prevCacheHeight = recordKey === undefined ? undefined : changedRecord.get(recordKey);
      // 快速切数据时 `start` 可能已经不在 `mergedData` 里
      const startItem = props.data[range.value.start];
      if (startItem !== undefined && prevCacheHeight === undefined && recordKey !== undefined) {
        if (getKey(startItem) === recordKey) {
          const realStartHeight = heights.get(recordKey) ?? 0;
          syncScrollTop((origin) => origin + (realStartHeight - (props.itemHeight ?? 0)));
        }
      }
    }
    // **每次布局后都执行** —— 否则记录会一直累积
    heights.resetRecord();
  },
  { flush: 'post' },
);

// Cached heights describe current data, while offscreen rows retain their measurements.
const currentData = computed(() => {
  const result = new Map<ItemKey, T>();
  props.data.forEach((item) => {
    result.set(getKey(item), item);
  });
  return result;
});
watch(
  currentData,
  (next, previous) => {
    let changed = false;
    for (const [key, item] of previous) {
      if (!next.has(key) || !Object.is(next.get(key), item))
        changed = heights.delete(key) || changed;
    }
    if (changed) updatedMark.value += 1;
    heightsState.collectHeight();
  },
  { flush: 'pre' },
);
function innerResize() {
  innerHeight.value = fillerRef.value?.getInnerHeight() ?? 0;
  heightsState.collectHeight();
}
onMounted(innerResize);
watch(
  [maxScrollHeight, () => props.height, () => props.virtual],
  () => {
    innerHeight.value = fillerRef.value?.getInnerHeight() ?? 0;
    syncScrollTop(offsetTop.value);
  },
  { flush: 'post' },
);
watch(
  [() => props.scrollWidth, () => size.value.width, isRTL],
  () => {
    const holder = holderRef.value;
    const left = keepInHorizontalRange(offsetLeft.value, props.scrollWidth, size.value.width);
    if (holder) {
      holder.scrollLeft = isRTL.value ? -left : left;
      offsetLeft.value = isRTL.value ? -holder.scrollLeft : holder.scrollLeft;
    } else offsetLeft.value = left;
  },
  { flush: 'post' },
);
watch(
  () => size.value.width,
  (next, previous) => {
    if (next === previous || previous === 0) return;
    let changed = false;
    for (const key of currentData.value.keys()) changed = heights.delete(key) || changed;
    if (changed) updatedMark.value += 1;
    heightsState.collectHeight();
  },
);
let focusedBeforeUpdate: HTMLElement | null = null;
onBeforeUpdate(() => {
  const holder = holderRef.value;
  const active = holder?.ownerDocument.activeElement;
  focusedBeforeUpdate = holder && isHTMLElement(active) && holder.contains(active) ? active : null;
});
onUpdated(() => {
  const focused = focusedBeforeUpdate;
  if (focused?.isConnected && focused.ownerDocument.activeElement === focused.ownerDocument.body) {
    focused.focus({ preventScroll: true });
  }
  focusedBeforeUpdate = null;
});

// ============================== Size 查询 ==============================
const getSize = computed<GetSize>(() => {
  // In-place data/key changes invalidate prefix/key indices even before any DOM measurement.
  void currentData.value;
  void updatedMark.value;
  void heights.id;
  return createSizeGetter<T>({
    data: props.data,
    getKey,
    heights,
    itemHeight: props.itemHeight ?? 0,
  });
});

// ============================== scrollTo ==============================
let scrollRequest = 0;
let disposed = false;
onBeforeUnmount(() => {
  disposed = true;
  scrollRequest += 1;
});
const scrollTo: ScrollTo = (arg) => {
  if (disposed) return;
  const request = ++scrollRequest;
  const target = normalizeScrollArg(arg, props.data, getKey);

  if (target.kind === 'flash') {
    // 上游是「闪一下自绘滚动条」。本包无自绘滚动条 ⇒ no-op（契约文档 §5.1 第 3 条）
    return;
  }

  if (target.kind === 'top') {
    syncScrollTop(target.top);
    return;
  }

  if (target.kind === 'pos') {
    const holder = holderRef.value;
    if (target.left !== undefined) {
      const left = keepInHorizontalRange(target.left, props.scrollWidth, size.value.width);
      if (holder) {
        holder.scrollLeft = isRTL.value ? -left : left;
        offsetLeft.value = isRTL.value ? -holder.scrollLeft : holder.scrollLeft;
      } else offsetLeft.value = left;
    }
    // 上游这里调 `scrollTo(config.top)`：`top` 未给时是 no-op
    if (target.top !== undefined) {
      syncScrollTop(target.top);
    }
    return;
  }

  void runItemScrollTo(target, request);
};

async function runItemScrollTo(
  target: {
    index: number;
    key?: ItemKey;
    align?: 'top' | 'bottom';
    offset?: number | ((info: { getSize: GetSize; align?: 'top' | 'bottom' }) => number);
  },
  request: number,
): Promise<void> {
  let times = 0;
  let index = target.index;
  let align = target.align;
  let lastTop: number | null | undefined;

  while (times < MAX_SCROLL_TO_TIMES) {
    heightsState.collectHeight();
    // 让微任务里的高度收集与 DOM 更新先落地（上游靠 React 的 effect 重跑得到同样的边界）
    await nextTick();
    if (disposed || request !== scrollRequest) return;

    const holder = holderRef.value;
    if (!holder) return;

    // 每轮重解析：数据可能在迭代期间才就绪
    if (target.key !== undefined) {
      index = props.data.findIndex((item) => getKey(item) === target.key);
    }

    const offset = resolveScrollOffset(target.offset, { getSize: getSize.value, align });
    const result = computeScrollTarget<T>({
      data: props.data,
      getKey,
      heights,
      itemHeight: props.itemHeight ?? 0,
      index,
      align,
      offset,
      containerHeight: holder.clientHeight,
      scrollTop: holder.scrollTop,
      lastTop,
    });

    align = result.nextAlign;
    lastTop = result.targetTop;
    if (result.targetTop !== null) {
      syncScrollTop(result.targetTop);
    }
    if (!result.needCollectHeight) {
      return;
    }
    times += 1;
  }

  devUseWarning('VirtualList')(
    false,
    `Seems \`scrollTo\` with virtual list reach the max limitation (${MAX_SCROLL_TO_TIMES}). Please fire an issue.`,
  );
}

// ========================== Visible Change ==========================
// 上游用 `useLayoutEffect`，它在**挂载后也会跑一次** ⇒ 这里必须 `onMounted` +
// `watch`，只写 `watch` 会漏掉首次。
const reportVisible = (): void => {
  const { start, end } = range.value;
  emit('visibleChange', props.data.slice(start, end + 1), props.data);
};
onMounted(reportVisible);
watch([() => range.value.start, () => range.value.end, currentData], reportVisible, {
  flush: 'post',
});

// The public ref describes the actual native scroll holder and outer container.
defineExpose({
  get nativeElement() {
    return holderRef.value;
  },
  get containerElement() {
    return containerRef.value;
  },
  getScrollInfo,
  scrollTo,
});

// ============================== Render ==============================
function renderList(): VNode {
  const { prefixCls } = props;
  const mergedClassName = [prefixCls, isRTL.value ? `${prefixCls}-rtl` : undefined, attrs.class];

  // ============================ holder ============================
  let holderStyle: Record<string, string | number> | null = null;
  if (props.height !== undefined) {
    holderStyle = {
      // ⚠️ 必须自己带单位 —— Vue 运行时的 setStyle 不做 px 补全（见 filler.ts 的 `px`）
      [props.fullHeight ? 'height' : 'maxHeight']: `${props.height}px`,
      // ⚠️ 与上游的差异：上游在这里是 'auto' 但当 useVirtual 时改成 'hidden'
      //    并配自绘滚动条。本包恒为 'auto'（原生滚动）。见契约文档 §5.1。
      overflowY: 'auto',
      // 必须保留：否则浏览器会在内容变化时自动调整 scrollTop（scroll anchoring）
      overflowAnchor: 'none',
    };
  }

  // ============================= items ============================
  // ⚠️ **不能包一层 `<div>`** —— 上游的 `Item` 是 `cloneElement(children, { ref })`，
  //    即把 ref 挂在**渲染出来的元素本身**上。包一层的话 `offsetHeight` 量到的是包装层，
  //    而**项的 margin 在包装层之外**，`useHeights` 的 `offsetHeight + margins` 会漏掉它，
  //    有 margin 的项高度全错。
  const { start, end } = range.value;
  const items: VNode[] = [];

  for (let i = 0; i < end - start + 1; i += 1) {
    const item = props.data[start + i];
    if (item === undefined) {
      continue;
    }
    const eleIndex = start + i;
    const raw = slots.default?.({
      item,
      index: eleIndex,
      style: { width: props.scrollWidth === undefined ? undefined : `${props.scrollWidth}px` },
      offsetX: offsetLeft.value,
    });
    const child = singleItemVNode(raw);
    if (!child) {
      devUseWarning('VirtualList')(
        false,
        'The default slot must render exactly one element per item.',
      );
      continue;
    }
    const key = getKey(item);
    function bindItem(vnode: VNode, instance?: Element | ComponentPublicInstance | null) {
      if (instance === null) {
        heightsState.setInstanceRef(key, null);
        return;
      }
      const root: unknown =
        instance === undefined ? vnode.el : '$el' in instance ? instance.$el : instance;
      const element = getElement(root);
      // Public el/anchor are available after mounting static or component content.
      // A static block spanning sibling roots must never be measured as its first element.
      if (!isHTMLElement(element) || (vnode.anchor && vnode.anchor !== vnode.el)) {
        devUseWarning('VirtualList')(
          false,
          'The default slot must render exactly one HTMLElement root per item.',
        );
        heightsState.setInstanceRef(key, null);
        return;
      }
      heightsState.setInstanceRef(key, element);
    }
    const node = cloneVNode(
      child,
      {
        key,
        ref: (instance: Element | ComponentPublicInstance | null) => bindItem(node, instance),
        onVnodeMounted: (vnode: VNode) => bindItem(vnode),
        onVnodeUpdated: (vnode: VNode) => bindItem(vnode),
      },
      true,
    );
    items.push(node);
  }

  const extraInfo: ExtraRenderInfo = {
    start,
    end,
    virtual: inVirtual.value,
    offsetX: offsetLeft.value,
    scrollTop: offsetTop.value,
    offsetY: fillerOffset.value,
    rtl: isRTL.value,
    getSize: getSize.value,
  };

  const outerAttrs: Record<string, unknown> = {};
  const holderAttrs: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attrs)) {
    if (
      name === 'id' ||
      name === 'role' ||
      name === 'tabindex' ||
      name === 'tabIndex' ||
      name.startsWith('aria-') ||
      /^on(?:Key|Focus|Blur)/.test(name)
    )
      holderAttrs[name] = value;
    else outerAttrs[name] = value;
  }
  const holderProps = {
    ...holderAttrs,
    ref: setHolder,
    onVnodeMounted: syncHolder,
    onVnodeUpdated: syncHolder,
    class: `${prefixCls}-holder`,
    style: holderStyle,
    onScroll: onFallbackScroll,
  };
  const holderChildren = [
    h(
      Filler,
      {
        prefixCls,
        height: scrollHeight.value,
        offsetY: fillerOffset.value,
        rtl: isRTL.value,
        scrollWidth: props.scrollWidth,
        innerProps: props.innerProps,
        ref: fillerRef,
        onInnerResize: innerResize,
      },
      {
        default: () => items,
        extra: () => slots.extra?.(extraInfo),
      },
    ),
  ];
  const component = toRaw(props.component);
  const holder =
    typeof component === 'string'
      ? h(component, holderProps, holderChildren)
      : h(component, holderProps, { default: () => holderChildren });

  return h(
    'div',
    {
      ...outerAttrs,
      // 上游把 RTL 的 `dir` 放在**外层容器**上（`containerProps` 展开在外层）
      ...(props.direction === undefined ? {} : { dir: props.direction }),
      ref: containerRef,
      class: mergedClassName,
      // 上游：`{...style, position: 'relative'}` —— position 覆盖用户传的
      style: [attrs.style, { position: 'relative' }],
    },
    [holder],
  );
}
</script>
<template><Content :node="renderList()" /></template>
