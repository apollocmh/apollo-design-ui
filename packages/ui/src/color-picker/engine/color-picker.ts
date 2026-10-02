/**
 * 引擎的**面板外壳** —— rc `ColorPicker.js`（154 行）的移植。
 *
 * ── 它是谁在渲染 ──────────────────────────────────────────────────────────────
 *
 * antd 的 `PanelPicker` 渲染的就是它：
 * `<RcColorPicker value={mergedPickerColor?.toHsb()} components={{ slider: ColorSlider }} …/>`。
 * 也就是说**颜色数学与面板 DOM 都在这里**，antd 层只负责「面板外的编排」。
 *
 * ── DOM 骨架（逐字节对齐 rc 产物）──────────────────────────────────────────────
 *
 * ```html
 * <div class="{p}-panel [-panel-disabled]">
 *   <Picker/>                                  ← HSB 取色区
 *   <div class="{p}-slider-container">
 *     <div class="{p}-slider-group [-slider-group-disabled-alpha]">
 *       <Slider type="hue" …/>
 *       <Slider type="alpha" …/>               ← disabledAlpha 时不渲染
 *     </div>
 *     <ColorBlock/>
 *   </div>
 * </div>
 * ```
 *
 * ── 四条判据 ─────────────────────────────────────────────────────────────────
 *
 * 1. **`value` 可以不是 `Color`**（antd 传的是 `HSBA`）⇒ 经 `useColorState` 的
 *    `generateColor` 归一（见 `use-color-state.ts` 判据 2）。
 * 2. **非受控时才写内部状态**：`if (!value) setColorValue(data)`（判据原文是 `!value`，
 *    不是 `value === undefined` —— 空串也走这条路）。
 * 3. **`onChangeComplete` 的两个包装都判「回调存在」**：`if (onChangeComplete) …`
 *    ⇒ 不存在时**连 `getHueColor` 都不算**（纯空转）。照抄。
 * 4. **alpha 滑块的渐变端色是 `colorValue.setA(1).toRgbString()`**（不透明版），
 *    起点恒为 `rgba(255, 0, 4, 0)`（rc 的**字面量**，不是 `rgba(255,0,0,0)`）。
 */

import { type Component, computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { Color } from './color';
import { ColorBlock } from './components/color-block';
import { Picker } from './components/picker';
import type { ColorGenInput, ColorPickerInfo } from './interface';
import { useColorState } from './use-color-state';
import { defaultColor, HUE_COLORS } from './util';

/** rc 的默认前缀（antd 层**恒**传自己的 `prefixCls`，所以这个值只在裸用引擎时出现）。 */
const ENGINE_DEFAULT_PREFIX_CLS = 'rc-color-picker';

type StyleLike = Record<string, string | number>;

export const EngineColorPicker = defineComponent({
  name: 'AColorPickerEnginePanel',
  props: {
    value: { type: null as unknown as PropType<ColorGenInput>, default: undefined },
    defaultValue: { type: null as unknown as PropType<ColorGenInput>, default: undefined },
    prefixCls: { type: String, default: ENGINE_DEFAULT_PREFIX_CLS },
    disabled: { type: Boolean, default: false },
    disabledAlpha: { type: Boolean, default: false },
    /** 滑块组件（antd 传 `ColorSlider`）。不传则只渲染取色区 + 色块。 */
    slider: { type: [Object, Function] as PropType<Component>, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<StyleLike>, default: undefined },
    panelRender: {
      type: Function as PropType<(panel: unknown) => unknown>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<(color: Color, info?: ColorPickerInfo) => void>,
      default: undefined,
    },
    onChangeComplete: {
      type: Function as PropType<(color: Color, info?: ColorPickerInfo) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const valueRef = computed<ColorGenInput | undefined>(() => props.value);
    const [colorValue, setColorValue] = useColorState(props.defaultValue || defaultColor, valueRef);

    /** 判据 4：alpha 滑块的终点色是**不透明**版本。 */
    const alphaColor = computed(() => colorValue.value.setAlpha(1).toRgbString());

    const handleChange = (data: Color, type?: ColorPickerInfo): void => {
      // 判据 2
      if (!props.value) {
        setColorValue(data);
      }
      props.onChange?.(data, type);
    };

    const getHueColor = (hue: number): Color => new Color(colorValue.value.setHue(hue));
    const getAlphaColor = (alpha: number): Color =>
      new Color(colorValue.value.setAlpha(alpha / 100));

    const onHueChange = (hue: number): void => {
      handleChange(getHueColor(hue), { type: 'hue', value: hue });
    };
    const onAlphaChange = (alpha: number): void => {
      handleChange(getAlphaColor(alpha), { type: 'alpha', value: alpha });
    };
    // 判据 3：回调不存在时纯空转
    const onHueChangeComplete = (hue: number): void => {
      if (props.onChangeComplete) {
        props.onChangeComplete(getHueColor(hue));
      }
    };
    const onAlphaChangeComplete = (alpha: number): void => {
      if (props.onChangeComplete) {
        props.onChangeComplete(getAlphaColor(alpha));
      }
    };

    return () => {
      const p = props.prefixCls;
      const color = colorValue.value;
      const Slider = props.slider;

      const sharedSliderProps = {
        prefixCls: p,
        disabled: props.disabled,
        color,
      };

      const groupChildren: VNodeChild[] = [];

      if (Slider) {
        groupChildren.push(
          h(Slider, {
            ...sharedSliderProps,
            type: 'hue',
            colors: HUE_COLORS,
            min: 0,
            max: 359,
            value: color.getHue(),
            onChange: onHueChange,
            onChangeComplete: onHueChangeComplete,
          }),
        );

        if (!props.disabledAlpha) {
          groupChildren.push(
            h(Slider, {
              ...sharedSliderProps,
              type: 'alpha',
              colors: [
                { percent: 0, color: 'rgba(255, 0, 4, 0)' },
                { percent: 100, color: alphaColor.value },
              ],
              min: 0,
              max: 100,
              value: color.a * 100,
              onChange: onAlphaChange,
              onChangeComplete: onAlphaChangeComplete,
            }),
          );
        }
      }

      const defaultPanel: VNodeChild[] = [
        h(Picker, {
          ...sharedSliderProps,
          onChange: handleChange,
          onChangeComplete: props.onChangeComplete,
        }),
        h('div', { class: `${p}-slider-container` }, [
          h(
            'div',
            {
              class: [
                `${p}-slider-group`,
                { [`${p}-slider-group-disabled-alpha`]: props.disabledAlpha },
              ],
            },
            groupChildren,
          ),
          h(ColorBlock, { color: color.toRgbString(), prefixCls: p }),
        ]),
      ];

      const content: VNodeChild =
        typeof props.panelRender === 'function'
          ? (props.panelRender(defaultPanel) as VNodeChild)
          : defaultPanel;

      return h(
        'div',
        {
          class: [`${p}-panel`, props.className, { [`${p}-panel-disabled`]: props.disabled }],
          style: props.style,
        },
        [content],
      );
    };
  },
});

export default EngineColorPicker;
