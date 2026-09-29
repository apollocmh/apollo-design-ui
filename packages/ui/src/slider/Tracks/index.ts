/**
 * `Tracks` / `Track` —— rc-slider `Tracks/{index,Track}.js`（78 + 66 行）的 Vue 等价物。
 *
 * `Tracks` 的三条判据（`docs/analysis/slider.md` §8）：
 *   1. **非 range**：`values` 为空 ⇒ **没有轨道**（`null` 值的 slider 不画已选段）；
 *      否则单段 `[min(startPoint ?? min, value), max(...)]`（⚠️ 取 min/max 使 `startPoint > value` 时仍成立）；
 *   2. **range**：`values[i] → values[i+1]` 逐段；
 *   3. `included === false` ⇒ 整体不渲染；`classNames.tracks` / `styles.tracks` 存在时
 *      额外渲染一条「合并轨道」（`index: null`，用 `replaceCls` 顶替默认类名）；
 *   4. **任一禁用把手 ⇒ 整轨不可拖**（`onStartMove` 置 undefined，rc 与 Track 里各拦一次）。
 *
 * `Track`：位置由 `getOffset` 算出的百分比，四方向分别写 `left/right/bottom/top` + `width/height`；
 * 类名 `${p}-track[-{i+1}][-draggable]`（序号类只在 range）。
 */

import type { CSSProperties } from 'vue';
import { computed, defineComponent, h, inject, type PropType } from 'vue';
import { sliderContextKey } from '../context';
import { getOffset } from '../util';

/** 单条轨道。 */
const Track = defineComponent({
  name: 'ASliderTrack',
  props: {
    prefixCls: { type: String, required: true },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    index: { type: Number as PropType<number | null>, default: null },
    /** 传了 ⇒ 该轨道可拖动（`-draggable` 类 + mousedown 处理）。 */
    onStartMove: {
      type: Function as PropType<(e: MouseEvent | TouchEvent, index: number) => void>,
      default: undefined,
    },
    /** 顶替默认类名（合并轨道用）。 */
    replaceCls: { type: String, default: undefined },
  },
  setup(props) {
    const context = inject(sliderContextKey) as import('../context').SliderContextValue;
    const trackPrefixCls = computed(() => `${props.prefixCls}-track`);

    return () => {
      const offsetStart = getOffset(props.start, context.min, context.max);
      const offsetEnd = getOffset(props.end, context.min, context.max);
      const positionStyle: CSSProperties = {};
      switch (context.direction) {
        case 'rtl':
          positionStyle.right = `${offsetStart * 100}%`;
          positionStyle.width = `${offsetEnd * 100 - offsetStart * 100}%`;
          break;
        case 'btt':
          positionStyle.bottom = `${offsetStart * 100}%`;
          positionStyle.height = `${offsetEnd * 100 - offsetStart * 100}%`;
          break;
        case 'ttb':
          positionStyle.top = `${offsetStart * 100}%`;
          positionStyle.height = `${offsetEnd * 100 - offsetStart * 100}%`;
          break;
        default:
          positionStyle.left = `${offsetStart * 100}%`;
          positionStyle.width = `${offsetEnd * 100 - offsetStart * 100}%`;
      }

      const className =
        props.replaceCls ??
        [
          trackPrefixCls.value,
          props.index !== null && context.range ? `${trackPrefixCls.value}-${props.index + 1}` : '',
          props.onStartMove ? `${props.prefixCls}-track-draggable` : '',
          context.classNames.track,
        ]
          .filter(Boolean)
          .join(' ');

      const onInternalStartMove = (e: MouseEvent | TouchEvent): void => {
        if (!context.disabled && props.onStartMove) {
          props.onStartMove(e, -1);
        }
      };

      return h('div', {
        class: className,
        style: { ...positionStyle, ...props.style },
        onMousedown: onInternalStartMove,
        onTouchstart: onInternalStartMove,
      });
    };
  },
});

/** 轨道集合。 */
export default defineComponent({
  name: 'ASliderTracks',
  props: {
    prefixCls: { type: String, required: true },
    style: { type: Object as PropType<CSSProperties | CSSProperties[]>, default: undefined },
    values: { type: Array as PropType<number[]>, required: true },
    startPoint: { type: Number, default: undefined },
    /** 可拖整轨（`range.draggableTrack` 且无禁用把手）。 */
    onStartMove: {
      type: Function as PropType<(e: MouseEvent | TouchEvent, index: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const context = inject(sliderContextKey) as import('../context').SliderContextValue;

    const hasDisabledHandle = computed(() =>
      props.values.some((_, index) => context.isHandleDisabled(index)),
    );
    const mergedStartMove = computed(() =>
      hasDisabledHandle.value ? undefined : props.onStartMove,
    );

    /** `[{start, end}]`；非 range 且无值时为空（不画轨道）。 */
    const trackList = computed<{ start: number; end: number }[]>(() => {
      if (!context.range) {
        if (props.values.length === 0) return [];
        const startValue = props.startPoint ?? context.min;
        const endValue = props.values[0] ?? context.min;
        return [{ start: Math.min(startValue, endValue), end: Math.max(startValue, endValue) }];
      }
      const list: { start: number; end: number }[] = [];
      for (let i = 0; i < props.values.length - 1; i += 1) {
        list.push({
          start: props.values[i] ?? context.min,
          end: props.values[i + 1] ?? context.max,
        });
      }
      return list;
    });

    return () => {
      if (!context.included) return null;
      const list = trackList.value;
      const nodes = [];

      // 合并轨道（只有语义槽存在时才额外渲染）
      if (list.length && (context.classNames.tracks || context.styles.tracks)) {
        const first = list[0] ?? { start: context.min, end: context.max };
        const last = list[list.length - 1] ?? first;
        nodes.push(
          h(Track, {
            key: 'tracks',
            prefixCls: props.prefixCls,
            index: null,
            start: first.start,
            end: last.end,
            replaceCls: [context.classNames.tracks, `${props.prefixCls}-tracks`]
              .filter(Boolean)
              .join(' '),
            style: context.styles.tracks as CSSProperties,
          }),
        );
      }

      list.forEach(({ start, end }, index) => {
        const style = Array.isArray(props.style) ? props.style[index] : props.style;
        nodes.push(
          h(Track, {
            key: index,
            prefixCls: props.prefixCls,
            index,
            start,
            end,
            style: { ...style, ...context.styles.track } as CSSProperties,
            onStartMove: mergedStartMove.value,
          }),
        );
      });

      return nodes;
    };
  },
});
