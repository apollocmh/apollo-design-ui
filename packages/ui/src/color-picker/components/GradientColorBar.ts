/**
 * `GradientColorBar` —— 渐变条（antd `es/color-picker/components/PanelPicker/GradientColorBar.tsx`
 * 149 行）。
 *
 * 只在 `mode === 'gradient'` 时渲染；它是 `GradientColorSlider` 的**状态壳**：
 * 把「拖拽时增点 / 移点 / 删点」翻译成新的 `AggregationColor` 并回调。
 *
 * ── 🚨 四条判据（都容易写错）──────────────────────────────────────────────────
 *
 * 1. **`colorsRef` 是「拖拽期间的快照」**：`onDragStart` 里若发现
 *    `rawValues.length > colorList.length`（用户点空白处**新增**了一个点），
 *    就把插好新点的数组存进 `colorsRef`；否则存当前 `colorList`。
 *    后续 `onDragChange` 只改 `colorsRef`（**不再重新读 props**）——
 *    否则拖动过程中 props 回流会把新点冲掉。
 * 2. **`onDragStart` 的插入用 `splice(draggingIndex, 0, …)`**，而 `onDragChange` 的移动
 *    **要重新排序**（`sortColors`）—— 一处插、一处排，别统一。
 * 3. **`onInternalChangeComplete` 用的是 `colorList`（props 派生的）**，
 *    不是 `colorsRef` —— 上游注释：拖拽结束后以**外部值**为准。
 * 4. **`activeIndex >= nextValues.length` 才重置**（`onActive(nextValues.length - 1)`）
 *    ⇒ 删点后把激活下标收回边界内。
 */

import { computed, defineComponent, h, type PropType, ref, type VNodeChild } from 'vue';
import { AggregationColor, type GradientColor } from '../color';
import type { ModeType } from '../interface';
import { getGradientPercentColor } from '../util';
import { GradientColorSlider, type SliderGradientColor } from './ColorSlider';

/** rc `sortColors`：按 percent 升序（返回**新数组**）。 */
function sortColors(colors: SliderGradientColor): SliderGradientColor {
  return [...colors].sort((a, b) => a.percent - b.percent);
}

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

export interface GradientColorBarProps {
  prefixCls: string;
  mode: ModeType;
  colors: GradientColor;
  onChange: (value: AggregationColor, pickColor?: boolean) => void;
  onChangeComplete: (value: AggregationColor) => void;
  onActive: (index: number) => void;
  activeIndex: number;
  onGradientDragging: (dragging: boolean) => void;
}

export const GradientColorBar = defineComponent({
  name: 'AColorGradientColorBar',
  props: {
    prefixCls: { type: String, required: true },
    mode: { type: String as PropType<ModeType>, required: true },
    colors: { type: Array as unknown as PropType<GradientColor>, required: true },
    onChange: {
      type: Function as PropType<(value: AggregationColor, pickColor?: boolean) => void>,
      required: true,
    },
    onChangeComplete: {
      type: Function as PropType<(value: AggregationColor) => void>,
      required: true,
    },
    onActive: { type: Function as PropType<(index: number) => void>, required: true },
    activeIndex: { type: Number, required: true },
    onGradientDragging: {
      type: Function as PropType<(dragging: boolean) => void>,
      required: true,
    },
  },
  setup(props) {
    const colorList = computed<SliderGradientColor>(() =>
      props.colors.map((info) => ({
        percent: info.percent,
        color: info.color.toRgbString(),
      })),
    );

    const values = computed(() => colorList.value.map((info) => info.percent));

    /** 判据 1：拖拽期间的快照。 */
    const colorsRef = ref<SliderGradientColor>(colorList.value);

    const onDragStart = (info: DragStartInfo): void => {
      if (info.rawValues.length > colorList.value.length) {
        // 新增点：在 draggingIndex 处插一个插值出来的颜色
        const newPointColor = getGradientPercentColor(colorList.value, info.draggingValue);
        const nextColors = [...colorList.value];
        nextColors.splice(info.draggingIndex, 0, {
          percent: info.draggingValue,
          color: newPointColor,
        });

        colorsRef.value = nextColors;
      } else {
        colorsRef.value = colorList.value;
      }

      props.onGradientDragging(true);
      props.onChange(new AggregationColor(sortColors(colorsRef.value)), true);
    };

    const onDragChange = (info: DragChangeInfo): void => {
      let nextColors = [...colorsRef.value];

      if (info.deleteIndex !== -1) {
        nextColors.splice(info.deleteIndex, 1);
      } else {
        const target = nextColors[info.draggingIndex];
        if (target) {
          // ⚠️ 上游把 `draggingValue`（类型是 `number | null`）直接写进 `percent`；
          //    这条路径上它恒为数字（`null` 只出现在「没有拖拽」的初始态），
          //    这里用 `?? 0` 让类型成立、行为不变。
          nextColors[info.draggingIndex] = { ...target, percent: info.draggingValue ?? 0 };
        }

        // 判据 2：移动后重新排序
        nextColors = sortColors(nextColors);
      }

      props.onChange(new AggregationColor(nextColors), true);
    };

    const onKeyDelete = (index: number): void => {
      const nextColors = [...colorList.value];
      nextColors.splice(index, 1);

      const nextColor = new AggregationColor(nextColors);

      props.onChange(nextColor);
      props.onChangeComplete(nextColor);
    };

    const onInternalChangeComplete = (nextValues: number[]): void => {
      // 判据 3：用 props 派生的 colorList，不是 colorsRef
      props.onChangeComplete(new AggregationColor(colorList.value));

      // 判据 4
      if (props.activeIndex >= nextValues.length) {
        props.onActive(nextValues.length - 1);
      }

      props.onGradientDragging(false);
    };

    return (): VNodeChild => {
      if (props.mode !== 'gradient') {
        return null;
      }

      return h(GradientColorSlider, {
        min: 0,
        max: 100,
        prefixCls: props.prefixCls,
        className: `${props.prefixCls}-gradient-slider`,
        colors: colorList.value,
        color: null,
        value: values.value,
        range: true,
        onChangeComplete: onInternalChangeComplete,
        disabled: false,
        type: 'gradient',
        activeIndex: props.activeIndex,
        onActive: props.onActive,
        onDragStart,
        onDragChange,
        onKeyDelete,
      });
    };
  },
});

export default GradientColorBar;
