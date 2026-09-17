/**
 * `VirtualList` —— 虚拟滚动容器。
 *
 * 契约来源：`@rc-component/virtual-list@1.5.1/es/List.js`（511 行）。
 *
 * ⚠️ **与上游的两处有意差异**（都要登记 `COMPATIBILITY.md`，见契约文档 §5）：
 *
 *   1. **不做自绘滚动条 ⇒ 用原生滚动。** 上游在虚拟化时把 holder 设成
 *      `overflowY: 'hidden'` 并渲染一个 `ScrollBar` 组件（含 `borderRadius: 99` 与
 *      `rgba(0, 0, 0, 0.5)`）。那是**视觉语义**，与本包的 `notDo` 冲突。
 *      连带后果：不做滚轮 / 触摸拦截（上游拦截的原因正是 `hidden` 让原生滚动失效），
 *      嵌套滚动的边界交接交给浏览器的 scroll chaining；`showScrollBar` 被接受但不生效；
 *      `scrollTo()` 无参调用变成 no-op（上游是「闪一下滚动条」）。
 *   2. **横向不做 `marginLeft` 模拟。** 上游用 `margin-left: -offsetX` 把内容左移来
 *      模拟横向滚动（holder 的 `overflow-x` 是 `hidden`）。本包改用原生横向滚动：
 *      设了 `scrollWidth` 时给 Filler 内层显式 `width`，让溢出交给 holder。
 */

import { devUseWarning, useResizeObserver } from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  isVNode,
  nextTick,
  onMounted,
  type PropType,
  ref,
  useAttrs,
  type VNode,
  watch,
} from 'vue';
import { findListDiffIndex } from './algorithm';
import type { FillerExposed } from './filler';
import { Filler } from './filler';
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
  type ScrollArg,
} from './scroll-target';
import { createSizeGetter } from './size';
import type { ExtraRenderInfo, GetSize, ItemKey, ScrollInfo, SizeInfo } from './types';
import { useHeights } from './use-heights';

/** `scrollTo` 的公开签名（与上游 `ScrollTo` 对齐）。 */
export type ScrollTo = (arg?: ScrollArg) => void;

export interface VirtualListExposed {
  /** 外层容器（上游的 `nativeElement` 是内层 holder；这里对齐上游给 holder） */
  nativeElement: HTMLElement | null;
  /** 当前虚拟滚动偏移。RTL 下 `x` 取 `-offsetLeft` */
  getScrollInfo(): ScrollInfo;
  scrollTo: ScrollTo;
}

export const VirtualList = defineComponent({
  name: 'AVirtualList',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: 'apollo-virtual-list' },
    data: { type: Array as PropType<unknown[]>, default: () => [] },
    height: { type: Number, default: undefined },
    itemHeight: { type: Number, default: undefined },
    /** 字符串（取项的字段）或函数。**必填** —— 没有它无法稳定复用 DOM */
    itemKey: {
      type: [String, Function] as PropType<string | ((item: unknown) => ItemKey)>,
      required: true,
    },
    /** 未虚拟化时也用 `height` 而不是 `maxHeight` 限制容器 */
    fullHeight: { type: Boolean, default: true },
    /** 传 `false` 强制走真实滚动 */
    virtual: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl' | undefined>, default: undefined },
    /** 设了它 ⇒ 强制虚拟化，并给 Filler 内层显式宽度 */
    scrollWidth: { type: Number, default: undefined },
    /**
     * ⚠️ **被接受但不生效** —— 滚动条可见性属视觉语义，由消费方用 CSS
     * （`scrollbar-width` / `::-webkit-scrollbar`）控制。声明它只为「消费方传了
     * 不会漏到 DOM 上」。见契约文档 §5.1。
     */
    showScrollBar: {
      type: [Boolean, String] as PropType<boolean | 'optional'>,
      default: 'optional',
    },
    /** 透传到 Filler 内层（消费方用它注入 `aria-*`） */
    innerProps: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    /** holder 的标签名 */
    component: { type: String, default: 'div' },
    onScroll: {
      type: Function as PropType<((event: Event) => void) | undefined>,
      default: undefined,
    },
    onVirtualScroll: {
      type: Function as PropType<((info: ScrollInfo) => void) | undefined>,
      default: undefined,
    },
    onVisibleChange: {
      type: Function as PropType<
        ((visibleList: unknown[], fullList: unknown[]) => void) | undefined
      >,
      default: undefined,
    },
  },
  setup(props, { slots, expose }) {
    const attrs = useAttrs();
    const containerRef = ref<HTMLElement | null>(null);
    const holderRef = ref<HTMLElement | null>(null);
    const fillerRef = ref<FillerExposed | null>(null);

    const offsetTop = ref(0);
    const offsetLeft = ref(0);
    const size = ref<SizeInfo>({ width: 0, height: props.height ?? 0 });

    // ============================ Item Key ============================
    const getKey = (item: unknown): ItemKey => {
      const { itemKey } = props;
      if (typeof itemKey === 'function') {
        return itemKey(item);
      }
      const record = item as Record<string, unknown> | null | undefined;
      const value = record?.[itemKey];
      // 上游直接返回 `item?.[itemKey]`（可能是 undefined）。这里对非 string/number
      // 回退到 `String(value)`，保证 `ItemKey` 的声明是真的。
      //
      // ⚠️ 回退的代价：键取不到时**所有项**都会得到同一个键（`'undefined'`），
      //    Vue 会因重复 key 复用错元素。这条告警让「itemKey 配错」可被发现。
      if (typeof value !== 'string' && typeof value !== 'number') {
        devUseWarning('VirtualList')(
          false,
          `\`itemKey\` (${String(itemKey)}) did not resolve to a string or number, so every item shares one key.`,
        );
        return String(value);
      }
      return value;
    };

    // ============================= Height =============================
    const heightsState = useHeights<unknown>(getKey);
    const { heights, updatedMark } = heightsState;

    const isRTL = computed(() => props.direction === 'rtl');

    const useVirtual = computed(() =>
      shouldUseVirtual(props.virtual, props.height, props.itemHeight),
    );

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
      return computeRange<unknown>({
        data: props.data,
        getKey,
        heights,
        itemHeight: props.itemHeight ?? 0,
        height: props.height ?? 0,
        offsetTop: offsetTop.value,
        useVirtual: useVirtual.value,
        inVirtual: inVirtual.value,
        measuredInnerHeight: fillerRef.value?.getInnerHeight() ?? 0,
      });
    });

    const scrollHeight = computed(() => range.value.scrollHeight);
    const fillerOffset = computed(() => range.value.offset);

    /** `scrollHeight - height`；`scrollHeight` 未定义时是 `NaN`（上游如此） */
    const maxScrollHeight = computed(() =>
      scrollHeight.value === undefined ? Number.NaN : scrollHeight.value - (props.height ?? 0),
    );

    // ============================== Size ==============================
    useResizeObserver({
      target: holderRef,
      onResize: (info) => {
        size.value = { width: info.offsetWidth, height: info.offsetHeight };
      },
    });

    // ============================== Scroll ============================
    const syncScrollTop = (newTop: number | ((origin: number) => number)): void => {
      const value = typeof newTop === 'function' ? newTop(offsetTop.value) : newTop;
      const aligned = keepInRange(value, maxScrollHeight.value);
      offsetTop.value = aligned;
      if (holderRef.value) {
        holderRef.value.scrollTop = aligned;
      }
    };

    const getScrollInfo = (): ScrollInfo => ({
      x: isRTL.value ? -offsetLeft.value : offsetLeft.value,
      y: offsetTop.value,
    });

    let lastVirtualScrollInfo = getScrollInfo();
    const triggerScroll = (): void => {
      const onVirtualScroll = props.onVirtualScroll;
      if (!onVirtualScroll) return;
      const next = getScrollInfo();
      if (lastVirtualScrollInfo.x !== next.x || lastVirtualScrollInfo.y !== next.y) {
        onVirtualScroll(next);
        lastVirtualScrollInfo = next;
      }
    };

    const onFallbackScroll = (event: Event): void => {
      const holder = event.currentTarget as HTMLElement;
      if (holder.scrollTop !== offsetTop.value) {
        syncScrollTop(holder.scrollTop);
      }
      // ⚠️ 与上游的差异：上游的横向偏移由它自己的滚轮处理驱动；
      //    我们用原生横向滚动，所以从 scrollLeft 读。
      if (holder.scrollLeft !== offsetLeft.value) {
        offsetLeft.value = holder.scrollLeft;
      }
      props.onScroll?.(event);
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
          const prevCacheHeight =
            recordKey === undefined ? undefined : changedRecord.get(recordKey);
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

    // ============================== Size 查询 ==============================
    const getSize = computed<GetSize>(() => {
      void updatedMark.value;
      void heights.id;
      return createSizeGetter<unknown>({
        data: props.data,
        getKey,
        heights,
        itemHeight: props.itemHeight ?? 0,
      });
    });

    // ============================== scrollTo ==============================
    const scrollTo: ScrollTo = (arg) => {
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
          offsetLeft.value = left;
          if (holder) {
            holder.scrollLeft = left;
          }
        }
        // 上游这里调 `scrollTo(config.top)`：`top` 未给时是 no-op
        if (target.top !== undefined) {
          syncScrollTop(target.top);
        }
        return;
      }

      void runItemScrollTo(target);
    };

    async function runItemScrollTo(target: {
      index: number;
      key?: ItemKey;
      align?: 'top' | 'bottom';
      offset?: number | ((info: { getSize: GetSize; align?: 'top' | 'bottom' }) => number);
    }): Promise<void> {
      let times = 0;
      let index = target.index;
      let align = target.align;
      let lastTop: number | null | undefined;

      while (times < MAX_SCROLL_TO_TIMES) {
        heightsState.collectHeight();
        // 让微任务里的高度收集与 DOM 更新先落地（上游靠 React 的 effect 重跑得到同样的边界）
        await nextTick();

        const holder = holderRef.value;
        if (!holder) break;

        // 每轮重解析：数据可能在迭代期间才就绪
        if (index < 0 && target.key !== undefined) {
          index = props.data.findIndex((item) => getKey(item) === target.key);
        }

        const offset = resolveScrollOffset(target.offset, { getSize: getSize.value, align });
        const result = computeScrollTarget<unknown>({
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
      if (!props.onVisibleChange) return;
      const { start, end } = range.value;
      props.onVisibleChange(props.data.slice(start, end + 1), props.data);
    };
    onMounted(reportVisible);
    watch([() => range.value.start, () => range.value.end, () => props.data], reportVisible, {
      flush: 'post',
    });

    // ============================ Item Diff =============================
    // 上游用 `useDiffItem` 把「唯一变化的项」暴露给消费方（用于滚动锚定）。
    // 本包保留同一算法并挂在实例上，供 `scrollTo({ key })` 之外的高级用法。
    const lastDiff = ref<{ index: number; multiple: boolean } | null>(null);
    let prevData: readonly unknown[] = props.data;
    watch(
      () => props.data,
      (next) => {
        const diff = findListDiffIndex(prevData, next, getKey);
        if (diff) {
          lastDiff.value = diff;
        }
        prevData = next;
      },
    );

    // ============================== Expose ==============================
    expose({
      get nativeElement() {
        return holderRef.value;
      },
      get containerElement() {
        return containerRef.value;
      },
      get lastDiff() {
        return lastDiff.value;
      },
      getScrollInfo,
      scrollTo,
    } satisfies VirtualListExposed & { containerElement: HTMLElement | null; lastDiff: unknown });

    // ============================== Render ==============================
    return () => {
      const { prefixCls } = props;
      const mergedClassName = [
        prefixCls,
        isRTL.value ? `${prefixCls}-rtl` : undefined,
        attrs.class,
      ];

      // ============================ holder ============================
      let holderStyle: Record<string, string | number> | null = null;
      if (props.height) {
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
          style: { width: props.scrollWidth },
          offsetX: offsetLeft.value,
        });
        const child = Array.isArray(raw) ? raw[0] : raw;

        if (!isVNode(child)) {
          devUseWarning('VirtualList')(
            false,
            'The default slot must render exactly one element per item.',
          );
          continue;
        }

        items.push(
          cloneVNode(child, {
            // `key` 会被 Vue 提取为 vnode.key，且 `key` 在 `isReservedProp` 里，
            // 不会写到 DOM 上 —— 所以这样设 key 是安全的。
            key: getKey(item),
            ref: (el: unknown) => {
              // 项若是**组件**，ref 拿到的是组件实例代理（没有 offsetParent），
              // 上游同样量不到 —— 这里统一归成 null，让该项回退到 itemHeight。
              heightsState.setInstanceRef(item, el instanceof HTMLElement ? el : null);
            },
          }),
        );
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

      const holder = h(
        props.component,
        {
          ref: holderRef,
          class: `${prefixCls}-holder`,
          style: holderStyle,
          onScroll: onFallbackScroll,
        },
        [
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
              onInnerResize: () => heightsState.collectHeight(),
            },
            {
              default: () => items,
              extra: () => slots.extra?.(extraInfo),
            },
          ),
        ],
      );

      return h(
        'div',
        {
          ...attrs,
          // 上游把 RTL 的 `dir` 放在**外层容器**上（`containerProps` 展开在外层）
          ...(isRTL.value ? { dir: 'rtl' } : {}),
          ref: containerRef,
          class: mergedClassName,
          // 上游：`{...style, position: 'relative'}` —— position 覆盖用户传的
          style: [attrs.style, { position: 'relative' }],
        },
        [holder],
      );
    };
  },
});
