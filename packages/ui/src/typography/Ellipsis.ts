/**
 * `Ellipsis` —— JS 省略号的**测量**与**裁剪**。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Base/Ellipsis.js`（`EllipsisMeasure`）。
 *
 * ── 它在做什么 ────────────────────────────────────────────────────────────────
 *
 * 原生 CSS 省略号（`text-overflow` / `-webkit-line-clamp`）有个做不到的事：
 * **在省略号后面再放东西**（`suffix`、展开按钮、复制按钮）。所以当
 * `needMeasureEllipsis` 为真时，antd 放弃 CSS，改用 JS：
 *
 *   1. 把完整内容渲染到一个**隐藏的测量容器**里，量它是否溢出（`scrollHeight > clientHeight`）；
 *   2. 若溢出，用**二分查找**找出「切到第几个字符时高度刚好不超」；
 *   3. 用切出来的内容替换真正显示的内容。
 *
 * 状态机（与 antd 逐字对应）：
 *
 * ```
 * NONE ──(enableMeasure && width && nodeLen)──> PREPARE ──> START ──┬──> NEED_ELLIPSIS ──> 二分
 *   ^                                                              └──> NO_NEED_ELLIPSIS
 *   └──(不满足条件)────────────────────────────────────────────────────┘
 * ```
 *
 * ── ⚠️ 与 antd 的**结构性**差异（PLATFORM，必须理解）────────────────────────────
 *
 * antd 用 `useLayoutEffect` 串起状态机：布局副作用在 commit 后**同步**执行，
 * 所以「setState(START) → React 立刻同步重渲染 → 下一个 layout effect 就能读到
 * 新渲染出来的测量容器」是一条可靠的时序。
 *
 * Vue 的调度器**没有**这个性质。`watch(cb, { flush: 'post' })` 的回调虽然跑在
 * DOM 更新之后，但在**同一个 post 批次内**再次修改状态所排出的回调会**插队到
 * 当前批次**里执行 —— 而组件的重渲染在下一个主队列里。也就是说
 * 「PREPARE 的回调里 set START，START 的回调立刻跑」时，测量容器**还没渲染**，
 * 读到的是空 DOM。
 *
 * 所以这里把状态机改成**显式 `await nextTick()`** 的异步流程：每次改状态后
 * 明确等到 DOM 落地再测量。可观测结果与 antd 一致（中间态同样只在 DOM 里存在
 * 一帧），但时序是确定的、不依赖调度器实现细节。
 *
 * ── 另外两处必须保留的细节 ────────────────────────────────────────────────────
 *
 *   1. **测量容器的内联样式是契约**：`position:fixed; display:block; left:0; top:0;
 *      pointerEvents:none; backgroundColor:rgba(255,0,0,0.65)`。它是**故意可见的
 *      红色半透明块**（调试期能一眼看出「这里在测量」），且固定定位 + 不接收指针
 *      事件，所以不会影响布局与交互。
 *   2. **数字样式要手写单位**。`width` / `top` 是数字，antd 写 `width: 220`，
 *      React 会补 `px`；Vue 的 `patchStyle` 直接把数字写进 CSSOM，jsdom 会**静默丢弃**
 *      （PITFALLS 32）。所以这里写成 `'220px'` 字符串。
 *
 * ── 这个组件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明真实浏览器里的像素结果 —— jsdom 的 `clientHeight` 恒为 0，
 *     L1/L2 只能通过**打桩**尺寸来驱动状态机（见 `__tests__/ellipsis.test.ts`）。
 *     真实排版结果由 L6 视觉回归覆盖。
 */

import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  nextTick,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';

import {
  cloneNodes,
  getNodesLen,
  type RenderableChild,
  sliceNodes,
  type TypographyNode,
  toNodeList,
} from './_util/nodes';

/** 测量状态。与 antd 的 `STATUS_MEASURE_*` 逐字对应。 */
const STATUS_MEASURE_NONE = 0;
const STATUS_MEASURE_PREPARE = 1;
const STATUS_MEASURE_START = 2;
const STATUS_MEASURE_NEED_ELLIPSIS = 3;
const STATUS_MEASURE_NO_NEED_ELLIPSIS = 4;

/** 多行裁剪的内联样式。与 antd 的 `lineClipStyle` 逐字对应。 */
const lineClipStyle: CSSProperties = {
  display: '-webkit-box',
  overflow: 'hidden',
  WebkitBoxOrient: 'vertical',
};

/**
 * 测量容器的**基础**内联样式 —— antd `Base/Ellipsis.js` 里 `MeasureText` 组件
 * 硬编码的那六条。
 *
 * ⚠️⚠️ 这六条**一条都不能少**，它们不是「调试用的红色背景」那么无关紧要：
 *
 *   - `position:fixed` + `left/top`：把测量容器挪出正常流，否则它会把父级撑高，
 *     而且 `top:400px` 那条（二分的中点）会真的把页面顶开 400px。
 *   - **`display:block`**：这是**功能性**的一条。二分中点用的容器只带 `measureStyle`
 *     （没有 `lineClipStyle`，因为它要量「自然高度」），如果 `display` 是默认的
 *     `inline`，`clientHeight` **恒为 0** ⇒ `midHeight > ellipsisHeight` 永远为假 ⇒
 *     二分一路收敛到 `maxIndex` ⇒ 裁剪结果是**整段原文**，一个字符都没省。
 *     2026-09-20 由 L6 视觉比对抓到（`typography/ellipsis__light__*` 与
 *     `typography/semantic__light__*` 的 `size-mismatch`：Vue 294px vs React 184px）。
 *   - `pointerEvents:none`：不挡交互。
 *   - `backgroundColor`：antd 故意留的半透明红块，调试期能一眼看出「这里在测量」。
 *     保留它 —— 它是与 antd 的可比对面之一，也让我们在截图里能立刻发现
 *     「测量容器没被回收」这类时序问题。
 *
 * ⚠️ 与 antd 的差异（PLATFORM）：antd 写 `left: 0` / `top: 0`（数字），React 补 `px`；
 *    这里写成字符串，理由见文件头第 2 条（PITFALLS 32）。
 */
const MEASURE_TEXT_STYLE: CSSProperties = {
  position: 'fixed',
  display: 'block',
  left: '0',
  top: '0',
  pointerEvents: 'none',
  backgroundColor: 'rgba(255, 0, 0, 0.65)',
};

/** 传给默认插槽的参数。对应 antd 的 `children(nodeList, canEllipsis)` 渲染属性。 */
export interface EllipsisSlotProps {
  /** 当前该渲染的节点列表（可能是裁剪后的）。 */
  nodes: TypographyNode[];
  /** 是否已经确定「需要省略」。测量容器里的调用恒为 `false`。 */
  canEllipsis: boolean;
}

export const Ellipsis = defineComponent({
  name: 'ATypographyEllipsis',
  props: {
    /** 是否启用 JS 测量（`mergedEnableEllipsis && !cssEllipsis`）。 */
    enableMeasure: { type: Boolean, default: undefined },
    /** 容器宽度。来自 `ResizeObserver` 的 `offsetWidth`。`0` 表示还没量到，不启动测量。 */
    width: { type: Number, default: 0 },
    /** 原始 children。 */
    // 内部：由父组件程序化传递/无模板上下文，VNode prop 合法（源自 Base 的 children 内容）
    text: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 行数。 */
    rows: { type: Number, default: 1 },
    /** 受控的展开态。展开后显示完整内容。 */
    expanded: { type: Boolean, default: undefined },
    /**
     * 「杂项依赖」。与 antd 的 `miscDeps` 逐项对应 —— 这些值都会改变**测量容器里
     * 渲染出来的内容**，任何一个变了都要重新测一次。
     *
     * ⚠️ 它是本组件在 Vue 侧的**必需品**，不是可选项：`watch` 的 getter 在 `setup()`
     *    里就会被求值，因此依赖数组里不能出现「要调用插槽才能拿到的东西」。
     */
    miscDeps: { type: Array as PropType<unknown[]>, default: () => [] },
    /** 省略状态变化回调。 */
    onEllipsis: { type: Function as PropType<(ellipsis: boolean) => void>, default: undefined },
  },
  setup(props, { slots }) {
    /**
     * 默认插槽。类型断言是必要的：`defineComponent` 的 `slots` 推断不出
     * 「带参数的默认插槽」，而这是 antd 渲染属性（render prop）在 Vue 里的对应物。
     */
    const renderSlot = (nodes: TypographyNode[], canEllipsis: boolean): RenderableChild[] =>
      ((slots.default as ((arg: EllipsisSlotProps) => VNodeChild) | undefined)?.({
        nodes,
        canEllipsis,
      }) ?? []) as RenderableChild[];

    const nodeList = computed(() => toNodeList(props.text));
    const nodeLen = computed(() => getNodesLen(nodeList.value));

    /**
     * 「完整内容」的渲染结果，供测量容器使用。
     *
     * antd 用 `useMemo(..., [text, ...measureDeps])` 把它钉住；Vue 的 `computed`
     * 会自动追踪插槽里读到的每一个响应式来源（`placement`、装饰开关……），
     * 所以不需要显式依赖列表 —— 这比 antd 的 `measureDeps` **更不容易漏**。
     */
    const fullContent = computed<RenderableChild[]>(() => renderSlot(nodeList.value, false));

    // ========================= Full Content =========================
    const ellipsisCutIndex = ref<[number, number] | null>(null);
    const cutMidRef = ref<HTMLSpanElement | null>(null);

    // ========================= NeedEllipsis =========================
    const measureWhiteSpaceRef = ref<HTMLSpanElement | null>(null);
    const needEllipsisRef = ref<HTMLSpanElement | null>(null);
    // 量 `rows - 1` 的高度，避免操作区把行高顶出去
    const descRowsEllipsisRef = ref<HTMLSpanElement | null>(null);
    const symbolRowEllipsisRef = ref<HTMLSpanElement | null>(null);

    const canEllipsis = ref(false);
    const needEllipsis = ref(STATUS_MEASURE_NONE);
    const ellipsisHeight = ref(0);
    const parentWhiteSpace = ref<string | null>(null);

    const cutMidIndex = computed(() =>
      ellipsisCutIndex.value
        ? Math.ceil((ellipsisCutIndex.value[0] + ellipsisCutIndex.value[1]) / 2)
        : 0,
    );

    const measureStyle = computed<CSSProperties>(() => ({
      // ⚠️ 必须补单位：数字会被 Vue 直接写进 CSSOM 而被 jsdom 丢弃（PITFALLS 32）
      width: `${props.width}px`,
      margin: '0',
      padding: '0',
      whiteSpace: parentWhiteSpace.value === 'nowrap' ? 'normal' : 'inherit',
    }));

    /** 二分查找：切到第几个字符时高度不超过 `ellipsisHeight`。 */
    const cutToFit = async (): Promise<void> => {
      // 每一轮：先让「当前 mid」的测量容器渲染出来，再量它
      for (;;) {
        const index = ellipsisCutIndex.value;
        if (!index) return;
        const [minIndex, maxIndex] = index;
        if (minIndex === maxIndex) return;

        await nextTick();

        const midHeight = cutMidRef.value?.clientHeight ?? 0;
        const isOverflow = midHeight > ellipsisHeight.value;
        let targetMidIndex = cutMidIndex.value;
        if (maxIndex - minIndex === 1) {
          targetMidIndex = isOverflow ? minIndex : maxIndex;
        }
        ellipsisCutIndex.value = isOverflow
          ? [minIndex, targetMidIndex]
          : [targetMidIndex, maxIndex];
      }
    };

    /** 完整的一次测量流程。对应 antd 的三段 `useLayoutEffect`。 */
    const measure = async (): Promise<void> => {
      if (!(props.enableMeasure && props.width && nodeLen.value)) {
        needEllipsis.value = STATUS_MEASURE_NONE;
        return;
      }

      // >>> PREPARE：渲染出「读父级 white-space」用的占位元素
      needEllipsis.value = STATUS_MEASURE_PREPARE;
      await nextTick();
      const whiteSpaceEl = measureWhiteSpaceRef.value;
      parentWhiteSpace.value = whiteSpaceEl ? getComputedStyle(whiteSpaceEl).whiteSpace : null;

      // >>> START：渲染出三个测量容器
      needEllipsis.value = STATUS_MEASURE_START;
      await nextTick();

      const base = needEllipsisRef.value;
      const isOverflow = !!base && base.scrollHeight > base.clientHeight;

      needEllipsis.value = isOverflow
        ? STATUS_MEASURE_NEED_ELLIPSIS
        : STATUS_MEASURE_NO_NEED_ELLIPSIS;
      ellipsisCutIndex.value = isOverflow ? [0, nodeLen.value] : null;
      canEllipsis.value = isOverflow;

      const baseRowsEllipsisHeight = base?.clientHeight ?? 0;
      const descRowsEllipsisHeight =
        props.rows === 1 ? 0 : (descRowsEllipsisRef.value?.clientHeight ?? 0);
      const symbolRowEllipsisHeight = symbolRowEllipsisRef.value?.clientHeight ?? 0;
      const maxRowsHeight = Math.max(
        baseRowsEllipsisHeight,
        // 带省略号的行高
        descRowsEllipsisHeight + symbolRowEllipsisHeight,
      );
      ellipsisHeight.value = maxRowsHeight + 1;

      props.onEllipsis?.(isOverflow);

      // >>> 二分裁剪
      if (isOverflow) {
        await cutToFit();
      }
    };

    /**
     * 触发测量。
     *
     * 依赖与 antd 的 `[width, text, rows, enableMeasure, nodeList, ...miscDeps]` **逐项对应**。
     *
     * ⚠️ 这里**不能**把 `fullContent` 放进依赖数组。antd 的 `useLayoutEffect` 可以自由
     *    地依赖「渲染出来的内容」，Vue 的 `watch` 不行：它在 `setup()` 里就要求值一遍
     *    所有 getter 来收集依赖，而 `fullContent` 会去调用插槽 —— 于是 Vue 会打
     *    `Slot "default" invoked outside of the render function` 告警。用 `miscDeps`
     *    把「影响内容的那几个值」显式传下来，才是这个平台上的等价物。
     */
    watch(
      [
        () => props.width,
        () => props.enableMeasure,
        () => props.rows,
        () => props.text,
        nodeList,
        () => props.miscDeps,
      ],
      () => {
        void measure();
      },
      { immediate: true, flush: 'post' },
    );

    // ============================ Render ============================
    const finalContent = computed<RenderableChild[]>(() => {
      // 没开测量 ⇒ 直接渲染完整内容
      if (!props.enableMeasure) {
        return renderSlot(nodeList.value, false);
      }

      const index = ellipsisCutIndex.value;
      if (needEllipsis.value !== STATUS_MEASURE_NEED_ELLIPSIS || !index || index[0] !== index[1]) {
        const content = renderSlot(nodeList.value, false);
        // 还没量完（或不需要省略）时，用 CSS 限制最大行数，避免出现滚动条闪一下
        // https://github.com/ant-design/ant-design/issues/42958
        if ([STATUS_MEASURE_NO_NEED_ELLIPSIS, STATUS_MEASURE_NONE].includes(needEllipsis.value)) {
          return content;
        }
        return [
          h(
            'span',
            { style: { ...lineClipStyle, WebkitLineClamp: props.rows } },
            cloneNodes(content),
          ),
        ];
      }

      return renderSlot(
        props.expanded ? nodeList.value : sliceNodes(nodeList.value, index[0]),
        canEllipsis.value,
      );
    });

    return () => {
      const children: VNodeChild[] = [finalContent.value];

      // >>> 三段测量容器（只在 START 态存在一帧）
      if (needEllipsis.value === STATUS_MEASURE_START) {
        children.push(
          h(
            'span',
            {
              'aria-hidden': true,
              ref: needEllipsisRef,
              style: {
                ...MEASURE_TEXT_STYLE,
                ...measureStyle.value,
                ...lineClipStyle,
                WebkitLineClamp: props.rows,
              },
            },
            // ⚠️ 同一份内容会被渲染到多个测量容器里，必须克隆（否则 DOM 会被搬走）
            cloneNodes(fullContent.value),
          ),
          h(
            'span',
            {
              'aria-hidden': true,
              ref: descRowsEllipsisRef,
              style: {
                ...MEASURE_TEXT_STYLE,
                ...measureStyle.value,
                ...lineClipStyle,
                WebkitLineClamp: props.rows - 1,
              },
            },
            cloneNodes(fullContent.value),
          ),
          h(
            'span',
            {
              'aria-hidden': true,
              ref: symbolRowEllipsisRef,
              style: {
                ...MEASURE_TEXT_STYLE,
                ...measureStyle.value,
                ...lineClipStyle,
                WebkitLineClamp: 1,
              },
            },
            renderSlot([], true),
          ),
        );
      }

      // >>> 二分的当前中点
      if (
        needEllipsis.value === STATUS_MEASURE_NEED_ELLIPSIS &&
        ellipsisCutIndex.value &&
        ellipsisCutIndex.value[0] !== ellipsisCutIndex.value[1]
      ) {
        children.push(
          h(
            'span',
            {
              'aria-hidden': true,
              ref: cutMidRef,
              style: { ...MEASURE_TEXT_STYLE, ...measureStyle.value, top: '400px' },
            },
            renderSlot(sliceNodes(nodeList.value, cutMidIndex.value), true),
          ),
        );
      }

      // >>> 读父级 white-space 的占位元素（只在 PREPARE 态存在一帧）
      if (needEllipsis.value === STATUS_MEASURE_PREPARE) {
        children.push(h('span', { style: { whiteSpace: 'inherit' }, ref: measureWhiteSpaceRef }));
      }

      return children;
    };
  },
});
