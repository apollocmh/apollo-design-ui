/**
 * `Picker` —— HSB 取色面板（rc `components/Picker.js` + `Transform.js`）。
 *
 * ── DOM 骨架（rc `Picker.js` 的产物，逐字节对齐）────────────────────────────────
 *
 * ```html
 * <div class="{p}-select" (pickerRef)>
 *   <div class="{p}-palette" style="position:relative">
 *     <div style="position:absolute;left:…%;top:…%;z-index:1;transform:translate(-50%,-50%)" (transformRef)>
 *       <div class="{p}-handler" style="background-color:rgb(…)">
 *     </div>
 *     <div class="{p}-saturation" style="background-color:hsl(…,100%,50%);background-image:…">
 *   </div>
 * </div>
 * ```
 *
 * ── 🚨 与上游的一处**有意**差异：`Transform` 内联 ────────────────────────────────
 *
 * 上游把「绝对定位的包装 div」抽成了 `Transform` 组件，它存在的**唯一**意义是
 * 承载 `forwardRef`（`useColorDrag` 要拿它的矩形）。Vue 里模板 ref 可以直接挂在
 * `div` 上 ⇒ 抽成组件反而要额外 `expose({ nativeElement })` 再取一次。
 * **DOM 产物逐字节相同**，登记为 PLATFORM（纯实现形态差异）。
 *
 * ── 两条必须照抄的判据 ────────────────────────────────────────────────────────
 *
 * 1. **`colorRef` 是拖拽期间的「最新颜色」缓存**：`onDragChange` 算出新色后**先写它**，
 *    `onDragChangeComplete` 读的也是它 —— 因为 `onChangeComplete` 的语义是
 *    「拖拽结束那一刻的颜色」，而不是「当前 prop」。
 * 2. **手柄底色是 `color.toRgbString()`**（含 alpha），而面板底色是
 *    `hsl(h, 100%, 50%)` —— 两者取的不是同一个量（`h` 来自 `toHsb()`）。
 */

import { defineComponent, h, type PropType, ref, shallowRef } from 'vue';
import type { Color } from '../color';
import type { TransformOffset } from '../interface';
import { useColorDrag } from '../use-color-drag';
import { calcOffset, calculateColor } from '../util';
import { ColorHandler } from './handler';
import { ColorPalette } from './palette';

export const Picker = defineComponent({
  name: 'AColorPickerEnginePicker',
  props: {
    color: { type: Object as PropType<Color>, required: true },
    prefixCls: { type: String, required: true },
    disabled: { type: Boolean, default: false },
    onChange: { type: Function as PropType<(color: Color) => void>, default: undefined },
    onChangeComplete: { type: Function as PropType<(color: Color) => void>, default: undefined },
  },
  setup(props) {
    const pickerRef = ref<HTMLElement | null>(null);
    const transformRef = ref<HTMLElement | null>(null);
    /** 判据 1：拖拽期间的最新颜色。 */
    const colorRef = shallowRef<Color>(props.color);

    const onDragChange = (offset: TransformOffset): void => {
      const container = pickerRef.value;
      const target = transformRef.value;
      if (!container || !target) {
        return;
      }
      const calcColor = calculateColor(
        offset,
        container.getBoundingClientRect(),
        target.getBoundingClientRect(),
        props.color,
      );
      colorRef.value = calcColor;
      props.onChange?.(calcColor);
    };

    const [offset, dragStartHandle] = useColorDrag({
      color: () => props.color,
      containerRef: pickerRef,
      targetRef: transformRef,
      calculate: () => calcOffset(props.color),
      onDragChange,
      onDragChangeComplete: () => props.onChangeComplete?.(colorRef.value),
      disabledDrag: props.disabled,
    });

    return () => {
      const { prefixCls } = props;
      const hsb = props.color.toHsb();

      return h(
        'div',
        {
          ref: pickerRef,
          class: `${prefixCls}-select`,
          // ⚠️ 键名必须是 `onMousedown`（小写 `d`）—— Vue 的 `parseName` 会
          //    `hyphenate` 后半段，写成 `onMouseDown` 会得到事件名 `mouse-down`（永不触发）。
          onMousedown: dragStartHandle,
          onTouchstart: dragStartHandle,
        },
        [
          h(ColorPalette, { prefixCls }, () => [
            // `Transform` 内联（见文件头）
            h(
              'div',
              {
                ref: transformRef,
                style: {
                  position: 'absolute',
                  left: `${offset.value.x}%`,
                  top: `${offset.value.y}%`,
                  zIndex: '1',
                  transform: 'translate(-50%, -50%)',
                },
              },
              [h(ColorHandler, { color: props.color.toRgbString(), prefixCls })],
            ),
            h('div', {
              class: `${prefixCls}-saturation`,
              style: {
                backgroundColor: `hsl(${hsb.h},100%, 50%)`,
                backgroundImage:
                  'linear-gradient(0deg, #000, transparent),linear-gradient(90deg, #fff, hsla(0, 0%, 100%, 0))',
              },
            }),
          ]),
        ],
      );
    };
  },
});

export default Picker;
