/**
 * `ColorSlider` —— 面板里的滑块（antd `es/color-picker/components/ColorSlider.tsx` 177 行）。
 *
 * 本文件导出两个组件（与上游同名同分工）：
 *
 * | 导出 | 上游 | 用途 |
 * |---|---|---|
 * | `GradientColorSlider` | 同名（named） | 支持渐变条的完整版（`type` 三档之一） |
 * | `SingleColorSlider`（default） | 同名（default） | 把 `value: number` 适配成 `[number]`，给引擎面板的 `components.slider` 用 |
 *
 * ── 🚨 为什么是 `.ts` 而不是 `.vue`（COMPONENT-RULES.md §2 条件 2）───────────────
 *
 * 本组件要复刻上游的 `handleRender` —— 它做的是
 * **「把 `ori.props` 展开、再覆盖其中三个键（`onFocus` / `style` / `className` / `onKeyDown`）」**，
 * 且被覆盖的 `onFocus` / `onKeyDown` **必须在新函数里回调原函数**（顺序：先自己的逻辑、后原函数）。
 *
 * 本仓 `Slider` 用 **`#handle` scoped slot** 替代 `handleRender`（见 PITFALLS 319），
 * 槽参数给了 `nodeProps`（含全部事件）。模板写法是 `v-bind="nodeProps"` + `@focus="…"`，
 * 而 Vue 的 `mergeProps` 会把两个 `onFocus` **合并成数组**（原函数**先**跑）——
 * 与上游「自己的逻辑先跑」**顺序相反**。渲染函数里用
 * `h('div', { ...nodeProps, onFocus: wrapped })` 才是**展开后覆盖**（原键被丢弃、
 * 由 `wrapped` 内部显式回调），与上游逐字等价。
 *
 * ── 另一条判据：`range` 恒传对象 ──────────────────────────────────────────────
 *
 * 上游对**所有**三档都传 `range={{ editable: range, minCount: 2 }}`（对象是**真值**
 * ⇒ 恒为 range 模式）⇒ 手柄会带 `-handle-1` 类。上游快照实测：
 * `class="ant-slider-handle ant-slider-handle-1 ant-color-picker-slider-handle"`。
 * 别"优化"成 `range={range}`。
 */

import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  type VNodeChild,
} from 'vue';
import Slider from '../../slider';
import { unstableSliderContextKey } from '../../slider/context';
import type { SliderValue } from '../../slider/interface';
import type { AggregationColor } from '../color';
import { getGradientPercentColor } from '../util';

/** 渐变条的颜色段（`color` 是 CSS 串）。 */
export type SliderGradientColor = { color: string; percent: number }[];

/** 三档：色相 / 透明度 / 渐变条。 */
export type ColorSliderType = 'hue' | 'alpha' | 'gradient';

/** `Slider` 的 `#handle` 槽参数（与 `slider/Handles/Handle.ts` 的 `HandleSlotNodeInfo` 同形）。 */
interface HandleSlotInfo {
  index: number;
  value: number;
  nodeProps: Record<string, unknown>;
  className: string;
  style: CSSProperties;
}

/** `unstableSliderContextKey` 的两个回调（渐变条靠它们做「增点 / 移点 / 删点」）。 */
interface DragStartInfo {
  rawValues: number[];
  draggingIndex: number;
  draggingValue: number;
}
interface DragChangeInfo {
  rawValues: number[];
  deleteIndex: number;
  draggingIndex: number;
  draggingValue: number | null;
}

export interface ColorSliderProps {
  prefixCls: string;
  colors: SliderGradientColor;
  type: ColorSliderType;
  /** 当前色（`type === 'gradient'` 时上游传 `null`）。 */
  color: AggregationColor | null;
  min: number;
  max: number;
  value: number[];
  disabled?: boolean;
  range?: boolean;
  className?: string;
  activeIndex?: number;
  onActive?: (index: number) => void;
  onChange?: (value: number[]) => void;
  onChangeComplete: (value: number[]) => void;
  onDragStart?: (info: DragStartInfo) => void;
  onDragChange?: (info: DragChangeInfo) => void;
  onKeyDelete?: (index: number) => void;
}

export const GradientColorSlider = defineComponent({
  name: 'AColorGradientColorSlider',
  props: {
    prefixCls: { type: String, required: true },
    colors: { type: Array as unknown as PropType<SliderGradientColor>, required: true },
    type: { type: String as PropType<ColorSliderType>, required: true },
    color: { type: Object as PropType<AggregationColor | null>, default: null },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    value: { type: Array as unknown as PropType<number[]>, required: true },
    disabled: { type: Boolean, default: undefined },
    range: { type: Boolean, default: false },
    className: { type: String, default: undefined },
    activeIndex: { type: Number, default: undefined },
    onActive: { type: Function as PropType<(index: number) => void>, default: undefined },
    onChange: { type: Function as PropType<(value: number[]) => void>, default: undefined },
    onChangeComplete: { type: Function as PropType<(value: number[]) => void>, required: true },
    onDragStart: { type: Function as PropType<(info: DragStartInfo) => void>, default: undefined },
    onDragChange: {
      type: Function as PropType<(info: DragChangeInfo) => void>,
      default: undefined,
    },
    onKeyDelete: { type: Function as PropType<(index: number) => void>, default: undefined },
  },
  setup(props) {
    /**
     * 渐变条的增删点通道。
     *
     * ⚠️ 本仓 `Slider` **真的**会 `inject` 这个 key（`Slider.vue:346`），
     * 只是全仓此前没有 provide 点（PITFALLS 319）⇒ 这里是第一个消费者。
     * 用箭头包一层是为了**每次调用都读最新 props**（上游用 `useEvent` 稳定引用）。
     */
    provide(unstableSliderContextKey, {
      onDragStart: (info: DragStartInfo) => props.onDragStart?.(info),
      onDragChange: (info: DragChangeInfo) => props.onDragChange?.(info),
    });

    const linearCss = computed(() => {
      const colorsStr = props.colors.map((c) => `${c.color} ${c.percent}%`).join(', ');
      return `linear-gradient(90deg, ${colorsStr})`;
    });

    /** 手柄底色：alpha 档用当前色；hue 档用「该色相的满饱和满亮度」；gradient 档由槽里逐点算。 */
    const pointColor = computed(() => {
      const color = props.color;
      if (!color || !props.type) {
        return null;
      }
      if (props.type === 'alpha') {
        return color.toRgbString();
      }
      return `hsl(${color.toHsb().h}, 100%, 50%)`;
    });

    return () => {
      const p = props.prefixCls;

      return h(
        Slider,
        {
          min: props.min,
          max: props.max,
          value: props.value,
          disabled: props.disabled,
          track: false,
          className: [props.className, `${p}-slider`].filter(Boolean).join(' '),
          tooltip: { open: false },
          // ⚠️ 恒传对象（真值 ⇒ 恒为 range 模式）—— 上游如此，快照里有 `-handle-1`
          range: { editable: props.range, minCount: 2 },
          styles: {
            rail: { background: linearCss.value },
            handle: pointColor.value ? { background: pointColor.value } : {},
          },
          classNames: {
            rail: `${p}-slider-rail`,
            handle: `${p}-slider-handle`,
          },
          onChange: (next: SliderValue) => props.onChange?.(toNumberArray(next)),
          onChangeComplete: (next: SliderValue) => props.onChangeComplete(toNumberArray(next)),
        },
        {
          /** `handleRender` 的忠实复刻（见文件头）。 */
          handle: (info: HandleSlotInfo): VNodeChild => {
            const originalFocus = info.nodeProps.onFocus as ((e: FocusEvent) => void) | undefined;
            const originalKeyDown = info.nodeProps.onKeydown as
              | ((e: KeyboardEvent) => void)
              | undefined;

            const mergedStyle: CSSProperties = { ...info.style };
            if (props.type === 'gradient') {
              mergedStyle.background = getGradientPercentColor(props.colors, info.value);
            }

            return h('div', {
              ...info.nodeProps,
              class: [
                info.className,
                { [`${p}-slider-handle-active`]: props.activeIndex === info.index },
              ],
              style: mergedStyle,
              onFocus: (event: FocusEvent) => {
                props.onActive?.(info.index);
                originalFocus?.(event);
              },
              onKeydown: (event: KeyboardEvent) => {
                if ((event.key === 'Delete' || event.key === 'Backspace') && props.onKeyDelete) {
                  props.onKeyDelete(info.index);
                }
                originalKeyDown?.(event);
              },
            });
          },
        },
      );
    };
  },
});

/** `SliderValue` → `number[]`（`number` 包成 1 元数组）。 */
function toNumberArray(value: SliderValue): number[] {
  return Array.isArray(value) ? value : [value];
}

/**
 * `SingleColorSlider` —— 引擎面板要的形态（`value: number`）。
 *
 * 上游：`value={[value]}` + 两个 `[0]` 解包包装。
 * ⚠️ 解包用**解构默认值 0**（上游是 `onChange(v[0])`）—— 空数组在上游会传 `undefined`，
 * 而 `value` 恒为 1 元数组（`Slider` 的 `range.minCount` 是 2，但单值档只喂 1 个）
 * ⇒ 空数组不可达。用默认值是为了不引入 `!` 断言。
 */
export interface SingleColorSliderProps
  extends Omit<ColorSliderProps, 'value' | 'onChange' | 'onChangeComplete'> {
  value: number;
  onChange?: (value: number) => void;
  onChangeComplete: (value: number) => void;
}

export const SingleColorSlider = defineComponent({
  name: 'AColorSingleSlider',
  props: {
    prefixCls: { type: String, required: true },
    colors: { type: Array as unknown as PropType<SliderGradientColor>, required: true },
    type: { type: String as PropType<ColorSliderType>, required: true },
    color: { type: Object as PropType<AggregationColor | null>, default: null },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    value: { type: Number, required: true },
    disabled: { type: Boolean, default: undefined },
    range: { type: Boolean, default: false },
    className: { type: String, default: undefined },
    activeIndex: { type: Number, default: undefined },
    onActive: { type: Function as PropType<(index: number) => void>, default: undefined },
    onChange: { type: Function as PropType<(value: number) => void>, default: undefined },
    onChangeComplete: { type: Function as PropType<(value: number) => void>, required: true },
    onKeyDelete: { type: Function as PropType<(index: number) => void>, default: undefined },
  },
  setup(props) {
    return () =>
      h(GradientColorSlider, {
        prefixCls: props.prefixCls,
        colors: props.colors,
        type: props.type,
        color: props.color,
        min: props.min,
        max: props.max,
        value: [props.value],
        disabled: props.disabled,
        range: props.range,
        className: props.className,
        activeIndex: props.activeIndex,
        onActive: props.onActive,
        onKeyDelete: props.onKeyDelete,
        onChange: (next: number[]) => {
          const [first = 0] = next;
          props.onChange?.(first);
        },
        onChangeComplete: (next: number[]) => {
          const [first = 0] = next;
          props.onChangeComplete(first);
        },
      });
  },
});

export default SingleColorSlider;
