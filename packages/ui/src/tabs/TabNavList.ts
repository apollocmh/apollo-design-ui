/**
 * 导航区（rc `TabNavList/index.js` 593 行的 Vue 等价物）—— **本组件最难的一块**。
 *
 * ── 结构（逐字）────────────────────────────────────────────────────────────────
 *
 * ```
 * div.{p}-nav[role=tablist][aria-orientation=horizontal|vertical][class=header][style=header]
 * ├─ ExtraContent(left)                       → div.{p}-extra-content
 * ├─ div.{p}-nav-wrap[-ping-left|-right|-top|-bottom]
 * │  └─ div.{p}-nav-list[style: translate(x,y) / transition]
 * │     ├─ {tabNodes}
 * │     ├─ AddButton（editable-card）→ button.{p}-nav-add
 * │     └─ div.{p}-ink-bar[-animated]         ← **在 nav-list 内部**
 * ├─ OperationNode → div.{p}-nav-operations[-hidden]   ← **在 nav-wrap 外部（兄弟）**
 * └─ ExtraContent(right)
 * ```
 *
 * ── 测量链（全部走 DOM 实测，不是纯计算）────────────────────────────────────────
 *
 * | 量 | 来源 |
 * |---|---|
 * | `containerExcludeExtraSize` | nav 容器尺寸 − 左 extra − 右 extra |
 * | `tabContentSize` | `-nav-list` 尺寸 − `addSize`（⚠️ 列表**含** AddButton） |
 * | `addSize` / `operationSize` | `-nav-add` / `-nav-operations` 的尺寸 |
 * | `tabSizes` | 每个 `[data-node-key]` 的 `[w,h,left,top]`（相对 `-nav-list`） |
 *
 * `needScroll = floor(container) < floor(tabContent + add)`
 * `visibleTabContentValue = needScroll ? container − operationSize : container − addSize`
 *
 * ── 三处「只有真机能看出来」的细节 ─────────────────────────────────────────────
 *
 *   1. `getSize` 的 **< 1 容差**（`rect` 与 `offsetWidth` 差小于 1 才采信 `rect`）——
 *      去掉会让指示条与位移出现小数抖动；
 *   2. `transition: lockAnimation ? 'none' : undefined` —— 拖动/键盘期间**禁过渡**，
 *      否则位移会「追」手指（`doLockAnimation` 记时间戳，100ms 后清零）；
 *   3. `ping` 四类的判据**随 RTL 翻转**（见 `getTransformRange` 的注释）。
 *
 * ⚠️ jsdom 里 `ResizeObserver` 不存在（`observeResize` 退化成 no-op），所有尺寸恒 0
 *    ⇒ 「滚动/溢出」这条线**只能靠 L6 视觉**（`docs/analysis/tabs.md` R2）；
 *    本文件在挂载后主动跑一次 `onListHolderResize()`，让真机的首帧测量不等观察器回调。
 */

import { useResizeObserver } from '@apollo-design/utils';
import { computed, defineComponent, h, onMounted, type PropType, ref, watch } from 'vue';
import AddButton from './AddButton';
import ExtraContent from './ExtraContent';
import { useIndicator } from './hooks/use-indicator';
import { EMPTY_TAB_OFFSET, getTabOffsets, type TabOffset } from './hooks/use-offsets';
import { useTouchMove } from './hooks/use-touch-move';
import { getScrollToTabTransform, getVisibleRange } from './hooks/use-visible-range';
import type {
  TabPosition,
  TabsEditableConfig,
  TabsEditEvent,
  TabsExtraContent,
  TabsIndicator,
  TabsItem,
  TabsLocale,
  TabsMoreProps,
  TabsSemanticClassNames,
  TabsSemanticStyles,
} from './interface';
import OperationNode from './OperationNode';
import TabNode from './TabNode';
import {
  alignInRange as clampRange,
  genDataNodeKey,
  getSize,
  getTabSize,
  getTransformRange,
  getUnitValue,
  isTopOrBottom,
  stringify,
  type TabSizeTuple,
} from './util';

export default defineComponent({
  name: 'ATabsNavList',
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String, default: undefined },
    tabs: { type: Array as PropType<TabsItem[]>, required: true },
    activeKey: { type: String, default: undefined },
    animated: {
      type: Object as PropType<{ inkBar?: boolean; tabPane?: boolean }>,
      default: () => ({}),
    },
    tabPosition: { type: String as PropType<TabPosition>, default: 'top' },
    rtl: { type: Boolean, default: false },
    mobile: { type: Boolean, default: false },
    editable: { type: Object as PropType<TabsEditableConfig | undefined>, default: undefined },
    locale: { type: Object as PropType<TabsLocale | undefined>, default: undefined },
    more: { type: Object as PropType<TabsMoreProps | undefined>, default: undefined },
    tabBarGutter: { type: Number, default: undefined },
    extra: { type: null as unknown as PropType<TabsExtraContent>, default: undefined },
    indicator: { type: Object as PropType<TabsIndicator | undefined>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<(node: HTMLElement) => HTMLElement>,
      default: undefined,
    },
    classNames: {
      type: Object as PropType<TabsSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: { type: Object as PropType<TabsSemanticStyles | undefined>, default: undefined },
    popupClassName: { type: String, default: undefined },
    popupStyle: {
      type: Object as PropType<Record<string, unknown> | undefined>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, unknown> | undefined>, default: undefined },
    onTabClick: {
      type: Function as PropType<(key: string, event: TabsEditEvent) => void>,
      required: true,
    },
    onTabScroll: {
      type: Function as PropType<
        (info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => void
      >,
      default: undefined,
    },
  },
  setup(props, { expose }) {
    // ---- refs（测量用）----
    const containerRef = ref<HTMLElement | null>(null);
    // ⚠️ 只声明**用到的那一个方法**（`expose({ getElement })`），不写 `InstanceType` ——
    //    后者拿不到被 expose 的方法（TS2769/TS2339 的来源）
    type MeasurableInstance = { getElement: () => HTMLElement | null } | null;
    const extraLeftRef = ref<MeasurableInstance>(null);
    const extraRightRef = ref<MeasurableInstance>(null);
    const tabsWrapperRef = ref<HTMLElement | null>(null);
    const tabListRef = ref<HTMLElement | null>(null);
    const operationsRef = ref<MeasurableInstance>(null);
    const innerAddButtonRef = ref<MeasurableInstance>(null);

    const topOrBottom = computed(() => isTopOrBottom(props.tabPosition));

    // ---- 位移（两个轴各自可被拖动改变）----
    const transformLeft = ref(0);
    const transformTop = ref(0);

    // rc 用 `useSyncState(0, onChange)`：**值真的变了**才回调，方向按大小判
    watch(transformLeft, (next, prev) => {
      if (topOrBottom.value && props.onTabScroll) {
        props.onTabScroll({ direction: next > prev ? 'left' : 'right' });
      }
    });
    watch(transformTop, (next, prev) => {
      if (!topOrBottom.value && props.onTabScroll) {
        props.onTabScroll({ direction: next > prev ? 'top' : 'bottom' });
      }
    });

    // ---- 测量结果 ----
    const containerExcludeExtraSize = ref<[number, number]>([0, 0]);
    const tabContentSize = ref<[number, number]>([0, 0]);
    const addSize = ref<[number, number]>([0, 0]);
    const operationSize = ref<[number, number]>([0, 0]);
    const tabSizes = ref<Map<string, TabSizeTuple>>(new Map());

    const tabOffsets = computed(() =>
      getTabOffsets(
        props.tabs.map((tab) => tab.key),
        tabSizes.value,
        tabContentSize.value[0],
      ),
    );

    const containerExcludeExtraSizeValue = computed(() =>
      getUnitValue(containerExcludeExtraSize.value, topOrBottom.value),
    );
    const tabContentSizeValue = computed(() =>
      getUnitValue(tabContentSize.value, topOrBottom.value),
    );
    const addSizeValue = computed(() => getUnitValue(addSize.value, topOrBottom.value));
    const operationSizeValue = computed(() => getUnitValue(operationSize.value, topOrBottom.value));

    const needScroll = computed(
      () =>
        Math.floor(containerExcludeExtraSizeValue.value) <
        Math.floor(tabContentSizeValue.value + addSizeValue.value),
    );
    const visibleTabContentValue = computed(() =>
      needScroll.value
        ? containerExcludeExtraSizeValue.value - operationSizeValue.value
        : containerExcludeExtraSizeValue.value - addSizeValue.value,
    );

    const transformRange = computed<[number, number]>(() =>
      getTransformRange(
        topOrBottom.value,
        props.rtl,
        visibleTabContentValue.value,
        tabContentSizeValue.value,
      ),
    );
    const transformMin = computed(() => transformRange.value[0]);
    const transformMax = computed(() => transformRange.value[1]);

    const alignInRange = (value: number): number =>
      clampRange(value, transformMin.value, transformMax.value);

    // ---- 拖动期间锁定过渡 ----
    const lockAnimation = ref<number>(0);
    let touchMovingTimer: ReturnType<typeof setTimeout> | undefined;

    const clearTouchMoving = (): void => {
      if (touchMovingTimer !== undefined) {
        clearTimeout(touchMovingTimer);
        touchMovingTimer = undefined;
      }
    };
    const doLockAnimation = (): void => {
      lockAnimation.value = Date.now();
    };

    useTouchMove(tabsWrapperRef, (offsetX, offsetY) => {
      // Skip scroll if place is enough
      if (!needScroll.value) return false;
      if (topOrBottom.value) {
        transformLeft.value = alignInRange(transformLeft.value + offsetX);
      } else {
        transformTop.value = alignInRange(transformTop.value + offsetY);
      }
      clearTouchMoving();
      doLockAnimation();
      return true;
    });

    watch(lockAnimation, (value) => {
      clearTouchMoving();
      if (value) {
        touchMovingTimer = setTimeout(() => {
          lockAnimation.value = 0;
        }, 100);
      }
    });

    // ---- 可见区间 ----
    const visibleRange = computed<[number, number]>(() =>
      getVisibleRange(
        tabOffsets.value,
        visibleTabContentValue.value,
        topOrBottom.value ? transformLeft.value : transformTop.value,
        tabContentSizeValue.value,
        addSizeValue.value,
        operationSizeValue.value,
        {
          keys: props.tabs.map((tab) => tab.key),
          tabPosition: props.tabPosition,
          rtl: props.rtl,
        },
      ),
    );
    const visibleStart = computed(() => visibleRange.value[0]);
    const visibleEnd = computed(() => visibleRange.value[1]);

    const hiddenTabs = computed(() => [
      ...props.tabs.slice(0, visibleStart.value),
      ...props.tabs.slice(visibleEnd.value + 1),
    ]);
    const hasDropdown = computed(() => hiddenTabs.value.length > 0);

    // ---- scrollToTab（激活页签必须可见）----
    const scrollToTab = (key?: string): void => {
      const targetKey = key ?? props.activeKey;
      const tabOffset: TabOffset =
        (targetKey !== undefined ? tabOffsets.value.get(targetKey) : undefined) ?? EMPTY_TAB_OFFSET;

      if (topOrBottom.value) {
        const next = getScrollToTabTransform(
          tabOffset,
          transformLeft.value,
          visibleTabContentValue.value,
          true,
          props.rtl,
        );
        // ⚠️ 副作用：切到横向时把另一个轴归零（避免残留位移）
        transformTop.value = 0;
        transformLeft.value = alignInRange(next);
      } else {
        const next = getScrollToTabTransform(
          tabOffset,
          transformTop.value,
          visibleTabContentValue.value,
          false,
          false,
        );
        transformLeft.value = 0;
        transformTop.value = alignInRange(next);
      }
    };

    // ---- 焦点与键盘 ----
    const focusKey = ref<string | undefined>(undefined);
    const isMouse = ref(false);

    const enabledTabs = computed(() =>
      props.tabs.filter((tab) => !tab.disabled).map((tab) => tab.key),
    );

    const onOffset = (offset: number): void => {
      const len = enabledTabs.value.length;
      if (!len) return;
      const base = focusKey.value ?? props.activeKey;
      const currentIndex = base === undefined ? -1 : enabledTabs.value.indexOf(base);
      const nextIndex = (currentIndex + offset + len) % len;
      focusKey.value = enabledTabs.value[nextIndex];
    };

    const handleRemoveTab = (removalTabKey: string | undefined, e: TabsEditEvent): void => {
      if (removalTabKey === undefined || !props.editable) return;
      const removeIndex = enabledTabs.value.indexOf(removalTabKey);
      const removeTab = props.tabs.find((tab) => tab.key === removalTabKey);
      const removable = !removeTab?.disabled && removeTab?.closable !== false;
      if (!removable) return;

      e.preventDefault();
      e.stopPropagation();
      props.editable.onEdit('remove', { key: removalTabKey, event: e });

      // when remove last tab, focus previous tab
      if (removeIndex === enabledTabs.value.length - 1) {
        onOffset(-1);
      } else {
        onOffset(1);
      }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      // ⚠️ rc 读的是 `e.code`（不是 keyCode）
      const { code } = e;
      const isRTL = props.rtl && topOrBottom.value;
      const firstEnabledTab = enabledTabs.value[0];
      const lastEnabledTab = enabledTabs.value[enabledTabs.value.length - 1];

      switch (code) {
        case 'ArrowLeft':
          // ⚠️ 纵向**什么都不做**（也**不** preventDefault）
          if (topOrBottom.value) onOffset(isRTL ? 1 : -1);
          break;
        case 'ArrowRight':
          if (topOrBottom.value) onOffset(isRTL ? -1 : 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!topOrBottom.value) onOffset(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (!topOrBottom.value) onOffset(1);
          break;
        case 'Home':
          e.preventDefault();
          focusKey.value = firstEnabledTab;
          break;
        case 'End':
          e.preventDefault();
          focusKey.value = lastEnabledTab;
          break;
        case 'Enter':
        case 'Space':
          e.preventDefault();
          props.onTabClick(focusKey.value ?? props.activeKey ?? '', e);
          break;
        case 'Backspace':
        case 'Delete':
          handleRemoveTab(focusKey.value, e);
          break;
        default:
          break;
      }
    };

    // ---- 指示条 ----
    const activeTabOffset = computed(() =>
      props.activeKey !== undefined ? tabOffsets.value.get(props.activeKey) : undefined,
    );
    const { style: indicatorStyle } = useIndicator(
      () => activeTabOffset.value,
      () => ({
        horizontal: topOrBottom.value,
        rtl: props.rtl,
        indicator: props.indicator,
      }),
    );

    // ---- 测量 ----
    const updateTabSizes = (): void => {
      const next = new Map<string, TabSizeTuple>();
      const listRect = tabListRef.value?.getBoundingClientRect();
      if (tabListRef.value && listRect) {
        for (const { key } of props.tabs) {
          const node = tabListRef.value.querySelector(`[data-node-key="${genDataNodeKey(key)}"]`);
          if (node) {
            const [width, height, left, top] = getTabSize(node, listRect);
            next.set(key, [width, height, left, top]);
          }
        }
      }
      tabSizes.value = next;
    };

    const onListHolderResize = (): void => {
      const containerSize = getSize(containerRef.value);
      const extraLeftSize = getSize(extraLeftRef.value?.getElement() ?? null);
      const extraRightSize = getSize(extraRightRef.value?.getElement() ?? null);
      containerExcludeExtraSize.value = [
        containerSize[0] - extraLeftSize[0] - extraRightSize[0],
        containerSize[1] - extraLeftSize[1] - extraRightSize[1],
      ];

      const newAddSize = getSize(innerAddButtonRef.value?.getElement() ?? null);
      addSize.value = newAddSize;
      operationSize.value = getSize(operationsRef.value?.getElement() ?? null);

      // Which includes add button size
      const tabContentFullSize = getSize(tabListRef.value);
      tabContentSize.value = [
        tabContentFullSize[0] - newAddSize[0],
        tabContentFullSize[1] - newAddSize[1],
      ];

      updateTabSizes();
    };

    // rc 用三个嵌套的 `<ResizeObserver onResize>` 包住三个节点；本仓给每个节点挂一次 hook
    useResizeObserver({ target: containerRef, onResize: onListHolderResize });
    useResizeObserver({ target: tabsWrapperRef, onResize: onListHolderResize });
    useResizeObserver({ target: tabListRef, onResize: onListHolderResize });

    // key 列表变化 ⇒ 重测（rc 的 `useEffect([keys.join('_')])`）
    watch(
      () => props.tabs.map((tab) => tab.key).join('_'),
      () => updateTabSizes(),
    );

    // 激活页签 / 区间变化 ⇒ 把它滚进可见区
    watch(
      () => [
        props.activeKey,
        transformMin.value,
        transformMax.value,
        stringify(activeTabOffset.value),
        stringify(tabOffsets.value),
        topOrBottom.value,
      ],
      () => scrollToTab(),
    );

    // rtl 变化要重算（rc 的 `useEffect([rtl])`）
    watch(
      () => props.rtl,
      () => onListHolderResize(),
    );

    // 真机首帧：ResizeObserver 的首次回调本就会来，但 jsdom 下没有观察器 ⇒
    // 这里主动跑一次，让「尺寸恒 0」成为**确定结论**而不是「没跑到」。
    onMounted(onListHolderResize);

    // `renderTabBar` / `#tabBar` 槽需要这些回调（rc 把它们暴露给自定义 tabBar）
    expose({
      scrollToTab,
      onListHolderResize,
      nativeElement: (): HTMLElement | null => containerRef.value,
    });

    // ---- 渲染 ----
    const tabNodeStyle = computed<Record<string, unknown>>(() => {
      if (props.tabBarGutter === undefined) return {};
      return topOrBottom.value
        ? { marginInlineStart: props.tabBarGutter }
        : { marginTop: props.tabBarGutter };
    });

    return () => {
      const {
        prefixCls,
        id,
        tabs,
        activeKey,
        animated,
        mobile,
        editable,
        locale,
        more,
        tabBarGutter,
        extra,
        classNames: semanticClassNames,
        styles: semanticStyles,
      } = props;
      const wrapPrefix = `${prefixCls}-nav-wrap`;
      const tabPositionTopOrBottom = topOrBottom.value;

      const pingLeft = tabPositionTopOrBottom
        ? props.rtl
          ? transformLeft.value !== transformMax.value
          : transformLeft.value < 0
        : undefined;
      const pingRight = tabPositionTopOrBottom
        ? props.rtl
          ? transformLeft.value > 0
          : transformLeft.value !== transformMin.value
        : undefined;
      const pingTop = tabPositionTopOrBottom ? undefined : transformTop.value < 0;
      const pingBottom = tabPositionTopOrBottom
        ? undefined
        : transformTop.value !== transformMin.value;

      const tabNodes = tabs.map((tab, i) =>
        h(TabNode as never, {
          key: tab.key,
          prefixCls,
          id,
          tab,
          itemClassName: semanticClassNames?.item,
          removeClassName: semanticClassNames?.remove,
          // 首项**不带** gutter（rc：`i === 0 ? styles.item : {...tabNodeStyle, ...styles.item}`）
          itemStyle:
            i === 0 ? semanticStyles?.item : { ...tabNodeStyle.value, ...semanticStyles?.item },
          removeStyle: semanticStyles?.remove,
          closable: tab.closable,
          editable,
          active: tab.key === activeKey,
          focus: tab.key === focusKey.value,
          removeAriaLabel: locale?.removeAriaLabel,
          tabCount: enabledTabs.value.length,
          currentPosition: i + 1,
          onTabClick: (key: string, event: TabsEditEvent) => props.onTabClick(key, event),
          onTabKeydown: handleKeyDown,
          onFocusTab: (key: string) => {
            if (!isMouse.value) focusKey.value = key;
            scrollToTab(key);
            doLockAnimation();
            if (!tabsWrapperRef.value) return;
            // Focus element will make scrollLeft change which we should reset back
            if (!props.rtl) tabsWrapperRef.value.scrollLeft = 0;
            tabsWrapperRef.value.scrollTop = 0;
          },
          onBlurTab: () => {
            focusKey.value = undefined;
          },
          onTabMousedown: (key: string, e: MouseEvent) => {
            isMouse.value = true;
            // Middle mouse button
            if (e.button === 1) handleRemoveTab(key, e);
          },
          onTabMouseup: () => {
            isMouse.value = false;
          },
          onRemoveTab: handleRemoveTab,
        }),
      );

      return h(
        'div',
        {
          ref: containerRef,
          role: 'tablist',
          'aria-orientation': tabPositionTopOrBottom ? 'horizontal' : 'vertical',
          class: [`${prefixCls}-nav`, props.className, semanticClassNames?.header]
            .filter(Boolean)
            .join(' '),
          style: { ...semanticStyles?.header, ...props.style },
          onKeydown: () => {
            // No need animation when use keyboard
            doLockAnimation();
          },
        },
        [
          h(ExtraContent as never, { ref: extraLeftRef, prefixCls, position: 'left', extra }),
          h(
            'div',
            {
              ref: tabsWrapperRef,
              class: [
                wrapPrefix,
                pingLeft ? `${wrapPrefix}-ping-left` : undefined,
                pingRight ? `${wrapPrefix}-ping-right` : undefined,
                pingTop ? `${wrapPrefix}-ping-top` : undefined,
                pingBottom ? `${wrapPrefix}-ping-bottom` : undefined,
              ]
                .filter(Boolean)
                .join(' '),
            },
            [
              h(
                'div',
                {
                  ref: tabListRef,
                  class: `${prefixCls}-nav-list`,
                  style: {
                    transform: `translate(${transformLeft.value}px, ${transformTop.value}px)`,
                    // 拖动/键盘期间禁过渡（否则位移会「追」手指）
                    transition: lockAnimation.value ? 'none' : undefined,
                  },
                },
                [
                  ...tabNodes,
                  h(AddButton as never, {
                    ref: innerAddButtonRef,
                    prefixCls,
                    locale,
                    editable,
                    style: {
                      ...(tabNodes.length === 0 ? {} : tabNodeStyle.value),
                      visibility: hasDropdown.value ? 'hidden' : null,
                    },
                  }),
                  h('div', {
                    class: [
                      `${prefixCls}-ink-bar`,
                      semanticClassNames?.indicator,
                      animated.inkBar ? `${prefixCls}-ink-bar-animated` : undefined,
                    ]
                      .filter(Boolean)
                      .join(' '),
                    style: { ...indicatorStyle.value, ...semanticStyles?.indicator },
                  }),
                ],
              ),
            ],
          ),
          h(OperationNode as never, {
            ref: operationsRef,
            prefixCls,
            id,
            tabs: hiddenTabs.value,
            locale,
            mobile,
            more,
            editable,
            tabBarGutter,
            rtl: props.rtl,
            removeAriaLabel: locale?.removeAriaLabel,
            getPopupContainer: props.getPopupContainer,
            removeClassName: semanticClassNames?.remove,
            removeStyle: semanticStyles?.remove,
            popupClassName: props.popupClassName,
            popupStyle: props.popupStyle,
            className: hasDropdown.value ? undefined : `${prefixCls}-nav-operations-hidden`,
            style: props.style,
            onTabClick: props.onTabClick,
          }),
          h(ExtraContent as never, { ref: extraRightRef, prefixCls, position: 'right', extra }),
        ],
      );
    };
  },
});
