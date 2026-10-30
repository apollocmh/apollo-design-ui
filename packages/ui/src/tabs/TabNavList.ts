/**
 * Tabs navigation: DOM measurement, scroll range, current focus, indicator and overflow.
 * Geometry retains the original rc-tabs 1.13.0 reference; Vue lifecycle owns observers
 * and timers. The visual navigation and its independent controls remain outside the
 * tablist's explicitly owned tab buttons.
 */

import { useResizeObserver } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  watch,
} from 'vue';
import { toCssSize } from '../_internal/to-css-size';
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
  TabsSlots,
} from './interface';
import OperationNode from './OperationNode';
import TabNode from './TabNode';
import {
  alignInRange as clampRange,
  getRemovable,
  getSize,
  getTabId,
  getTabSize,
  getTransformRange,
  getUnitValue,
  isTopOrBottom,
  stringify,
  type TabSizeTuple,
} from './util';

const popupSlots: SlotsType<Pick<TabsSlots, 'popupRender'>> = {};

export default defineComponent({
  name: 'ATabsNavList',
  slots: popupSlots,
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String as PropType<string | undefined>, default: undefined },
    tabs: { type: Array as PropType<TabsItem[]>, required: true },
    activeKey: { type: String as PropType<string | undefined>, default: undefined },
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
    tabBarGutter: { type: Number as PropType<number | undefined>, default: undefined },
    extra: { type: null as unknown as PropType<TabsExtraContent>, default: undefined },
    indicator: { type: Object as PropType<TabsIndicator | undefined>, default: undefined },
    getPopupContainer: {
      type: Function as PropType<((node: HTMLElement) => HTMLElement) | undefined>,
      default: undefined,
    },
    classNames: {
      type: Object as PropType<TabsSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: { type: Object as PropType<TabsSemanticStyles | undefined>, default: undefined },
    popupClassName: { type: String as PropType<string | undefined>, default: undefined },
    popupZIndex: { type: Number as PropType<number | undefined>, default: undefined },
    popupStyle: {
      type: Object as PropType<CSSProperties | undefined>,
      default: undefined,
    },
    className: { type: String as PropType<string | undefined>, default: undefined },
    style: { type: Object as PropType<CSSProperties | undefined>, default: undefined },
  },
  emits: {
    tabClick: (_key: string, _event: TabsEditEvent) => true,
    tabScroll: (_info: { direction: 'left' | 'right' | 'top' | 'bottom' }) => true,
  },
  setup(props, { expose, slots, emit }) {
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
      if (topOrBottom.value) {
        emit('tabScroll', { direction: next > prev ? 'left' : 'right' });
      }
    });
    watch(transformTop, (next, prev) => {
      if (!topOrBottom.value) {
        emit('tabScroll', { direction: next > prev ? 'top' : 'bottom' });
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
    onBeforeUnmount(clearTouchMoving);
    const doLockAnimation = (): void => {
      lockAnimation.value = Date.now();
    };

    useTouchMove(tabsWrapperRef, (offsetX, offsetY) => {
      // Skip scroll if place is enough
      if (!needScroll.value) return false;
      const current = topOrBottom.value ? transformLeft.value : transformTop.value;
      const next = alignInRange(current + (topOrBottom.value ? offsetX : offsetY));
      if (next === current) return false;
      if (topOrBottom.value) {
        transformLeft.value = next;
      } else {
        transformTop.value = next;
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

    const enabledTabs = computed(() =>
      props.tabs.filter((tab) => !tab.disabled).map((tab) => tab.key),
    );
    const tabStopKey = computed(() =>
      props.activeKey !== undefined && enabledTabs.value.includes(props.activeKey)
        ? props.activeKey
        : enabledTabs.value[0],
    );

    const onOffset = (offset: number): void => {
      const keys = enabledTabs.value;
      if (!keys.length) return;
      const base = focusKey.value ?? props.activeKey;
      const currentIndex = base === undefined ? -1 : keys.indexOf(base);
      const nextIndex =
        currentIndex < 0
          ? offset > 0
            ? 0
            : keys.length - 1
          : (currentIndex + offset + keys.length) % keys.length;
      focusKey.value = keys[nextIndex];
    };

    let pendingRemoval: { key: string; index: number } | undefined;
    const handleRemoveTab = (key: string | undefined, event: TabsEditEvent): void => {
      if (key === undefined) return;
      const tab = props.tabs.find((item) => item.key === key);
      if (!tab || !getRemovable(tab.closable, tab.closeIcon, props.editable, tab.disabled)) return;
      event.preventDefault();
      event.stopPropagation();
      pendingRemoval = { key, index: props.tabs.indexOf(tab) };
      props.editable?.onEdit('remove', { key, event });
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      const key = event.key || event.code;
      switch (key) {
        case 'ArrowLeft':
        case 'ArrowRight':
          if (topOrBottom.value) {
            event.preventDefault();
            const offset = key === 'ArrowRight' ? 1 : -1;
            onOffset(props.rtl ? -offset : offset);
          }
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          if (!topOrBottom.value) {
            event.preventDefault();
            onOffset(key === 'ArrowDown' ? 1 : -1);
          }
          break;
        case 'Home':
        case 'End':
          event.preventDefault();
          focusKey.value = key === 'Home' ? enabledTabs.value[0] : enabledTabs.value.at(-1);
          break;
        case 'Enter':
        case ' ':
        case 'Space': {
          event.preventDefault();
          const target = focusKey.value ?? props.activeKey;
          if (target !== undefined && enabledTabs.value.includes(target)) {
            emit('tabClick', target, event);
          }
          break;
        }
        case 'Backspace':
        case 'Delete':
          handleRemoveTab(focusKey.value ?? props.activeKey, event);
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
        const nodes = Array.from(tabListRef.value.children).filter((node) =>
          node.hasAttribute('data-node-key'),
        );
        props.tabs.forEach((tab, index) => {
          const node = nodes[index];
          if (node) {
            const [width, height, left, top] = getTabSize(node, listRect);
            next.set(tab.key, [width, height, left, top]);
          }
        });
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

    watch(
      [() => props.tabs.map((tab) => tab.key), enabledTabs],
      ([keys, enabled], [previous]) => {
        onListHolderResize();
        const removed =
          pendingRemoval && !keys.includes(pendingRemoval.key)
            ? pendingRemoval
            : focusKey.value !== undefined && !enabled.includes(focusKey.value)
              ? { key: focusKey.value, index: previous.indexOf(focusKey.value) }
              : undefined;
        if (removed) {
          const target =
            props.tabs.slice(Math.max(0, removed.index)).find((tab) => !tab.disabled) ??
            props.tabs.findLast((tab) => !tab.disabled);
          focusKey.value = target?.key;
          if (!target) innerAddButtonRef.value?.getElement()?.focus();
        }
        pendingRemoval = undefined;
      },
      { flush: 'post' },
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
      () => scrollToTab(focusKey.value ?? props.activeKey),
    );

    // rtl 变化要重算（rc 的 `useEffect([rtl])`）
    watch(
      () => [props.rtl, props.tabPosition],
      () => onListHolderResize(),
      { flush: 'post' },
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
    const tabNodeStyle = computed<CSSProperties>(() => {
      if (props.tabBarGutter === undefined) return {};
      // 🚨 必须过 `toCssSize`：Vue 3 不给 `style` 里的裸数字补 `px`，而
      //    `style.setProperty('margin-inline-start', 24)` 会被**静默丢弃**
      //    （PITFALLS 8 / D94；L2 的 gutter 用例就是这条的哨兵）。
      const gutter = toCssSize(props.tabBarGutter);
      return topOrBottom.value ? { marginInlineStart: gutter } : { marginTop: gutter };
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
        h(TabNode, {
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
          tabStop: tab.key === tabStopKey.value,
          focus: tab.key === focusKey.value,
          removeAriaLabel: locale?.removeAriaLabel,
          tabCount: enabledTabs.value.length,
          currentPosition: enabledTabs.value.indexOf(tab.key) + 1,
          onTabClick: (key: string, event: TabsEditEvent) => emit('tabClick', key, event),
          onTabKeydown: handleKeyDown,
          onFocusTab: (key: string) => {
            focusKey.value = key;
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
            // Middle mouse button
            if (e.button === 1) handleRemoveTab(key, e);
          },
          onRemoveTab: handleRemoveTab,
        }),
      );

      return h(
        'div',
        {
          ref: containerRef,
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
          h(ExtraContent, { ref: extraLeftRef, prefixCls, position: 'left', extra }),
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
              h('div', {
                role: 'tablist',
                'aria-orientation': tabPositionTopOrBottom ? 'horizontal' : 'vertical',
                'aria-owns':
                  tabs.length && id
                    ? tabs.map((tab) => getTabId(id, tab.key)).join(' ')
                    : undefined,
                style: { display: 'contents' },
              }),
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
                  h(AddButton, {
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
          h(
            OperationNode,
            {
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
              popupZIndex: props.popupZIndex,
              className: hasDropdown.value ? undefined : `${prefixCls}-nav-operations-hidden`,
              onTabClick: (key: string, event: TabsEditEvent) => emit('tabClick', key, event),
            },
            slots.popupRender ? { popupRender: slots.popupRender } : {},
          ),
          h(ExtraContent, { ref: extraRightRef, prefixCls, position: 'right', extra }),
        ],
      );
    };
  },
});
