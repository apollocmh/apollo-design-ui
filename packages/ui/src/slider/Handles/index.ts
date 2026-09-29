/**
 * `Handles` —— rc-slider `Handles/index.js`（94 行）的 Vue 等价物。
 *
 * 职责：
 *   1. 逐个渲染 `Handle`（`values.map`），把 `dragging` / `draggingDelete` / `style[index]`
 *      以及**事件通道**传下去（含 antd 层要的 `onMouseEnterChange` / `onMouseLeaveChange` /
 *      `onMouseDownChange` / `onBlur` —— 它们驱动 tooltip 的三态 open）；
 *   2. 维护「活动把手」状态（`activeVisible` / `activeIndex`）：range 且未锁定 open 时，
 *      antd 会用一个**隐藏的替身把手**挂那唯一的 tooltip（`activeHandleRender`）；
 *   3. `expose({ focus(index), hideHelp() })` —— Slider 的键盘推进与拖拽结束都要用。
 *
 * ⚠️ 与上游的唯一差异：rc 的 `hideHelp` 用 `flushSync` 保证「同步隐藏」；Vue 的 patch 是异步的
 *    （`nextTick`）。本仓按既有判例（D74：`flushSync` 无对应物，Vue 响应式同步即等价）**不用 flushSync**，
 *    直接改 ref —— 影响面是「拖拽结束那一帧内，外部若立刻读 DOM 可能仍看到替身把手」，
 *    已在 COMPATIBILITY 登记。
 */

import type { CSSProperties } from 'vue';
import { computed, defineComponent, h, type PropType, ref, type VNode } from 'vue';
import Handle from './Handle';

export default defineComponent({
  name: 'ASliderHandles',
  props: {
    prefixCls: { type: String, required: true },
    style: { type: Object as PropType<CSSProperties | CSSProperties[]>, default: undefined },
    values: { type: Array as PropType<number[]>, required: true },
    draggingIndex: { type: Number, default: -1 },
    draggingDelete: { type: Boolean, default: false },
    onStartMove: {
      type: Function as PropType<(e: MouseEvent | TouchEvent, index: number) => void>,
      default: undefined,
    },
    onOffsetChange: {
      type: Function as PropType<(offset: number | 'min' | 'max', index: number) => void>,
      default: undefined,
    },
    onChangeComplete: { type: Function as PropType<() => void>, default: undefined },
    onDelete: { type: Function as PropType<(index: number) => void>, default: undefined },
    onFocus: {
      type: Function as PropType<(e: FocusEvent, index: number) => void>,
      default: undefined,
    },
    onBlur: {
      type: Function as PropType<(e: FocusEvent, index: number) => void>,
      default: undefined,
    },
    /** antd 层：hover 开/关 tooltip。 */
    onMouseEnterChange: { type: Function as PropType<() => void>, default: undefined },
    onMouseLeaveChange: { type: Function as PropType<() => void>, default: undefined },
    /** antd 层：按下把手（置 dragging + 开 tooltip）。 */
    onMouseDownChange: { type: Function as PropType<() => void>, default: undefined },
    /** 是否用「活动把手替身」（antd 层：`range && !lockOpen`）。 */
    hasActiveHandle: { type: Boolean, default: false },
  },
  setup(props, { slots, expose }) {
    const handleRefs = ref<Record<number, { focus?: () => void } | null>>({});
    const activeIndex = ref(-1);
    const activeVisible = ref(false);

    const onHandleFocus = (e: FocusEvent, index: number): void => {
      activeIndex.value = index;
      activeVisible.value = true;
      props.onFocus?.(e, index);
    };

    const onHandleMouseEnter = (_e: MouseEvent, index: number): void => {
      activeIndex.value = index;
      activeVisible.value = true;
      props.onMouseEnterChange?.();
    };

    expose({
      focus: (index: number) => handleRefs.value[index]?.focus?.(),
      hideHelp: () => {
        // 见文件头：不引入 flushSync（D74 判例），只改 ref
        activeVisible.value = false;
      },
    });

    /** 活动替身的值（rc 取 `values[activeIndex]`）。 */
    const activeValue = computed(() => props.values[activeIndex.value]);

    return () => {
      const nodes: VNode[] = props.values.map((value, index) => {
        const dragging = props.draggingIndex === index;
        const style = Array.isArray(props.style) ? props.style[index] : props.style;
        return h(
          Handle,
          {
            key: index,
            ref: (node: unknown) => {
              handleRefs.value[index] = (node ?? null) as { focus?: () => void } | null;
            },
            prefixCls: props.prefixCls,
            value,
            valueIndex: index,
            style: style as CSSProperties | undefined,
            dragging,
            draggingDelete: dragging && props.draggingDelete,
            onStartMove: props.onStartMove,
            onOffsetChange: props.onOffsetChange,
            onChangeComplete: props.onChangeComplete,
            onDelete: props.onDelete,
            onFocus: onHandleFocus,
            onBlurChange: props.onBlur,
            onMouseEnter: onHandleMouseEnter,
            onMouseLeave: () => props.onMouseLeaveChange?.(),
            onMouseDownChange: () => props.onMouseDownChange?.(),
          },
          {
            default: slots.handle as never,
            wrapper: slots.wrapper as never,
          } as never,
        );
      });

      if (props.hasActiveHandle && activeVisible.value) {
        nodes.push(
          h(
            Handle,
            {
              key: 'active',
              prefixCls: props.prefixCls,
              value: activeValue.value ?? 0,
              valueIndex: null,
              dragging: props.draggingIndex !== -1,
              draggingDelete: props.draggingDelete,
              style: { pointerEvents: 'none' },
            },
            { default: slots.activeHandle as never } as never,
          ),
        );
      }

      return nodes;
    };
  },
});
