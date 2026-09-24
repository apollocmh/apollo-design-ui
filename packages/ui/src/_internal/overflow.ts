/**
 * Overflow —— `@rc-component/overflow@1.0.1` 的 Vue 版（横向溢出折叠基建）。
 *
 * 消费者：menu 的 horizontal 模式（overflowedIndicator 折叠）。
 *
 * 与 rc 的对应关系（逐条对齐，改名处注明）：
 * - `data` + `renderRawItem(item, index)`：menu 的 raw 渲染路径（menu 自带
 *   RawItem 语义 —— 每项直接是 li，由 renderRawItem 包）。
 * - `itemWidth`（估算宽）/ `maxCount`（'responsive' | number | 'invalidate'）。
 * - `registerSize(key, width)` 协议：子项测量上报；`restWidth` 同理。
 * - displayCount 计算（rc 的 useLayoutEffect 循环）抽成纯函数
 *   `calcDisplayCount` —— 可被 oracle 单测逐分支覆盖。
 *
 * jsdom / SSR：ResizeObserver 不可用 ⇒ 不测量 ⇒ containerWidth null ⇒
 * effect 早退 ⇒ displayCount 停 null。与 React 版行为一致（SSR 输出空列表），
 * L4/L6 各自钉住（D88）。
 */
import {
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type VNode,
  type VNodeChild,
  watch,
} from 'vue';

/** rc 的 RESPONSIVE / INVALIDATE 哨兵。 */
export const RESPONSIVE = 'responsive';
export const INVALIDATE = 'invalidate';

/**
 * rc Overflow useLayoutEffect 的循环（纯函数化）。
 *
 * @param containerWidth 容器宽（0/null ⇒ 不计算，返回 null）
 * @param widths 有序的每项宽（undefined = 未测量）
 * @param restWidth rest 节点宽（mergedRestWidth：max(prevRest, rest)）
 * @returns `[displayCount, suffixFixedStart, restReady]`；
 *   displayCount null = 未决定（保持现状）；notReady = displayCount 停 i-1 但 restReady 不置位。
 */
export function calcDisplayCount(
  containerWidth: number | null,
  widths: Array<number | undefined>,
  restWidth: number,
): { displayCount: number | null; notReady: boolean } {
  if (!containerWidth) {
    // rc：containerWidth 为 0 时整个 effect 早退（保持现状）
    return { displayCount: null, notReady: false };
  }
  let totalWidth = 0;
  const len = widths.length;
  const lastIndex = len - 1;

  if (!len) {
    return { displayCount: 0, notReady: false };
  }
  for (let i = 0; i < len; i += 1) {
    const currentItemWidth = widths[i];
    // Break since data not ready
    if (currentItemWidth === undefined) {
      return { displayCount: i - 1, notReady: true };
    }
    totalWidth += currentItemWidth;
    if (
      // Only one means `totalWidth` is the final width
      (lastIndex === 0 && totalWidth <= containerWidth) ||
      // Last two width will be the final width
      (i === lastIndex - 1 && totalWidth + (widths[lastIndex] ?? 0) <= containerWidth)
    ) {
      return { displayCount: lastIndex, notReady: false };
    } else if (totalWidth + restWidth > containerWidth) {
      // Can not hold all the content to show rest
      return { displayCount: i - 1, notReady: false };
    }
  }
  // 全部放下（rc 循环自然结束：displayCount 停在最后一次 update —— 无 update 发生
  // 时保持现状；但 rc 的循环若走到末尾说明全部放得下，最后一项的判定已经在
  // `i === lastIndex - 1` 分支处理 —— 循环走完未 break ⇒ 全部可见）
  return { displayCount: lastIndex, notReady: false };
}

const Overflow = defineComponent({
  name: 'AOverflow',
  props: {
    prefixCls: { type: String, default: 'apollo-overflow' },
    data: { type: Array as PropType<unknown[]>, default: () => [] },
    itemKey: {
      type: [String, Function] as PropType<
        string | ((item: unknown, index: number) => string | number)
      >,
      default: undefined,
    },
    /** 每项估算宽（responsive 时用于 SSR 初始截断）。 */
    itemWidth: { type: Number, default: 10 },
    maxCount: {
      type: [String, Number] as PropType<'responsive' | 'invalidate' | number>,
      default: undefined,
    },
    renderRawItem: {
      type: Function as PropType<(item: unknown, index: number) => VNodeChild>,
      default: undefined,
    },
    renderRest: {
      type: [Function, String] as PropType<((omitted: unknown[]) => VNodeChild) | string>,
      default: undefined,
    },
    onVisibleChange: {
      type: Function as PropType<(visibleCount: number) => void>,
      default: undefined,
    },
  },
  emits: {
    'visible-change': (_count: number) => true,
  },
  setup(props, { emit }) {
    const containerWidth = ref<number | null>(null);
    const itemWidths = ref(new Map<string | number, number>());
    const restWidth = ref(0);
    const prevRestWidth = ref(0);
    const displayCount = ref<number | null>(null);
    const restReady = ref(false);

    const isResponsive = computed(() => props.maxCount === RESPONSIVE);
    const shouldResponsive = computed(() => props.data.length > 0 && isResponsive.value);
    const invalidate = computed(() => props.maxCount === INVALIDATE);

    const mergedRestWidth = computed(() => Math.max(prevRestWidth.value, restWidth.value));

    const mergedData = computed(() => {
      let items = props.data;
      if (shouldResponsive.value) {
        items = props.data.slice(
          0,
          Math.min(props.data.length, (containerWidth.value ?? 0) / props.itemWidth),
        );
      } else if (typeof props.maxCount === 'number') {
        items = props.data.slice(0, props.maxCount);
      }
      return items;
    });

    const omittedItems = computed(() => {
      if (shouldResponsive.value) {
        return props.data.slice((displayCount.value ?? 0) + 1);
      }
      return props.data.slice(mergedData.value.length);
    });

    const getKey = (item: unknown, index: number): string | number => {
      if (typeof props.itemKey === 'function') return props.itemKey(item, index);
      if (props.itemKey && item && typeof item === 'object') {
        return ((item as Record<string, unknown>)[props.itemKey] as string | number) ?? index;
      }
      return index;
    };

    function registerSize(key: string | number, width: number | null): void {
      const clone = new Map(itemWidths.value);
      if (width === null) {
        clone.delete(key);
      } else {
        clone.set(key, width);
      }
      itemWidths.value = clone;
    }

    // displayCount 计算（rc useLayoutEffect → flush: post 的 watch）
    watch(
      [containerWidth, itemWidths, mergedRestWidth, mergedData],
      () => {
        if (!containerWidth.value) return;
        const widths = mergedData.value.map((item, index) =>
          itemWidths.value.get(getKey(item, index)),
        );
        const result = calcDisplayCount(containerWidth.value, widths, mergedRestWidth.value);
        if (result.displayCount === null) return;
        const prev = displayCount.value;
        if (prev !== result.displayCount) {
          displayCount.value = result.displayCount;
          if (!result.notReady) {
            restReady.value = result.displayCount < props.data.length - 1;
            emit('visible-change', result.displayCount);
            props.onVisibleChange?.(result.displayCount);
          }
        }
      },
      { flush: 'post', immediate: true },
    );

    // ---------------- 测量（jsdom / SSR：ResizeObserver 不可用 ⇒ 不测量） -------------
    let containerObserver: ResizeObserver | null = null;
    const itemObservers = new Map<string | number, ResizeObserver>();
    const canObserve = typeof ResizeObserver !== 'undefined';

    const containerRef = ref<HTMLElement | null>(null);
    const restRef = ref<HTMLElement | null>(null);

    onMounted(() => {
      if (!canObserve) return;
      containerObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          containerWidth.value = (entry.target as HTMLElement).clientWidth;
        }
      });
      if (containerRef.value) containerObserver.observe(containerRef.value);
    });
    onBeforeUnmount(() => {
      containerObserver?.disconnect();
      for (const ob of itemObservers.values()) ob.disconnect();
      itemObservers.clear();
    });

    const observeItem = (key: string | number, el: HTMLElement | null): void => {
      if (!canObserve) return;
      const prev = itemObservers.get(key);
      if (prev) {
        prev.disconnect();
        itemObservers.delete(key);
      }
      if (!el) return;
      const ob = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          registerSize(key, (entry.target as HTMLElement).offsetWidth);
        }
      });
      ob.observe(el);
      itemObservers.set(key, ob);
      // 首次同步测量（RO 异步；首帧宽度已布局好）
      registerSize(key, el.offsetWidth);
    };

    const displayRest = computed(() => restReady.value && omittedItems.value.length > 0);
    const mergedDisplayCount = computed(() => displayCount.value ?? 0);

    return () => {
      const itemPrefixCls = `${props.prefixCls}-item`;
      const nodes: VNodeChild[] = [];

      mergedData.value.forEach((item, index) => {
        const key = getKey(item, index);
        const display = index <= mergedDisplayCount.value;
        const hidden = shouldResponsive.value && !display;
        let node: VNodeChild;
        if (props.renderRawItem) {
          // raw 路径：menu 返回 li 本体 —— overflow 样式与测量 ref 直接注入该
          // vnode（rc 的 RawItem 语义：ul > li 必须直接相邻，不能包 div）。
          const raw = props.renderRawItem(item, index) as VNode;
          node = cloneVNode(raw, {
            style: {
              ...(raw.props?.style as Record<string, unknown> | undefined),
              opacity: hidden ? 0 : 1,
              height: hidden ? 0 : undefined,
              overflowY: hidden ? 'hidden' : undefined,
              order: shouldResponsive.value ? index : undefined,
              pointerEvents: hidden ? 'none' : undefined,
              position: hidden ? 'absolute' : undefined,
            },
            'aria-hidden': hidden ? true : undefined,
            ref: (el: Element | ComponentPublicInstance | null) => {
              observeItem(key, el as HTMLElement | null);
            },
          } as never);
        } else {
          node = h(
            'div',
            {
              class: itemPrefixCls,
              style: {
                opacity: hidden ? 0 : 1,
                height: hidden ? 0 : undefined,
                overflowY: hidden ? 'hidden' : undefined,
                order: shouldResponsive.value ? index : undefined,
                pointerEvents: hidden ? 'none' : undefined,
                position: hidden ? 'absolute' : undefined,
              },
              'aria-hidden': hidden ? true : undefined,
              ref: (el) => {
                observeItem(key, el as HTMLElement | null);
              },
            },
            String(item ?? ''),
          );
        }
        nodes.push(node);
      });

      // rest 节点
      if (
        shouldResponsive.value ||
        (typeof props.maxCount === 'number' && props.data.length > props.maxCount)
      ) {
        const restContent =
          typeof props.renderRest === 'function'
            ? props.renderRest(omittedItems.value)
            : (props.renderRest ?? `+ ${omittedItems.value.length} ...`);
        nodes.push(
          h(
            'div',
            {
              class: `${itemPrefixCls}-rest`,
              style: {
                opacity: displayRest.value ? 1 : 0,
                height: displayRest.value ? undefined : 0,
                overflowY: displayRest.value ? undefined : 'hidden',
                pointerEvents: displayRest.value ? undefined : 'none',
                position: displayRest.value ? undefined : 'absolute',
              },
              'aria-hidden': displayRest.value ? undefined : true,
              ref: (el) => {
                if (el && canObserve) {
                  restWidth.value = (el as HTMLElement).offsetWidth || restWidth.value;
                }
              },
            },
            restContent,
          ),
        );
      }

      return h(
        'div',
        {
          class: invalidate.value ? undefined : props.prefixCls,
          ref: containerRef,
        },
        nodes,
      );
    };
  },
});

export default Overflow;
