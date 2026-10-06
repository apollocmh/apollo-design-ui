/**
 * `ColorPickerPanel` —— 面板的**上下文提供者**（antd `es/color-picker/ColorPickerPanel.tsx`
 * 126 行）。
 *
 * 它几乎不做渲染，只做三件事：
 * 1. 把 props 拆成两条 context（`panelPicker` / `panelPresets`）并 `provide`；
 * 2. 组装 `-inner` > `-inner-content` 的骨架（`PanelPicker` + 可选 `Divider` + `PanelPresets`）；
 * 3. 有 `panelRender` 时把骨架交给它（并把 `Picker` / `Presets` 两个组件引用给它）。
 *
 * ── 🚨 两条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **`Divider` 只在 `presets` 是数组时插入**（`Array.isArray`，不是真值）
 *    —— 空数组**也会**插入 Divider。
 * 2. **`panelRender` 的返回值落在 `-inner` 里、`-inner-content` 外** ——
 *    上游快照实测：`-inner > custom-panel > -inner-content`。
 *
 * `.ts` 而非 `.vue` 的理由：`COMPONENT-RULES.md` §2 条件 1（纯渲染函数型内部件 ——
 * 它的 DOM 只有两层，价值全在 provide 与条件组装上）。
 */

import { isFunction } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, provide, type VNodeChild } from 'vue';
import { Divider } from '../divider';
import { provideNoFormStyle } from '../form/context';
import type { AggregationColor } from './color';
import PanelPicker from './components/PanelPicker.vue';
import PanelPresets from './components/PanelPresets';
import {
  type PanelPickerContextValue,
  type PanelPresetsContextValue,
  panelPickerContextKey,
  panelPresetsContextKey,
} from './context';
import type { ModeOptions } from './hooks/use-mode-color';
import type {
  ColorFormatType,
  ColorPickerPanelRenderExtra,
  ColorPickerProps,
  ModeType,
  PresetsItem,
} from './interface';

export interface ColorPickerPanelProps {
  prefixCls: string;
  value: AggregationColor;
  onChange: (value: AggregationColor, pickColor?: boolean) => void;
  onChangeComplete: (value: AggregationColor) => void;
  mode: ModeType;
  onModeChange: (mode: ModeType) => void;
  modeOptions: ModeOptions;
  activeIndex: number;
  onActive: (index: number) => void;
  gradientDragging: boolean;
  onGradientDragging: (dragging: boolean) => void;
  presets?: PresetsItem[];
  panelRender?: ColorPickerProps['panelRender'];
  format?: ColorFormatType;
  onFormatChange?: (format?: ColorFormatType) => void;
  onClear?: () => void;
  allowClear?: boolean;
  disabled?: boolean;
  disabledAlpha?: boolean;
  disabledFormat?: boolean;
}

export const ColorPickerPanel = defineComponent({
  name: 'AColorPickerPanel',
  props: {
    prefixCls: { type: String, required: true },
    value: { type: Object as unknown as PropType<AggregationColor>, required: true },
    onChange: {
      type: Function as PropType<(value: AggregationColor, pickColor?: boolean) => void>,
      required: true,
    },
    onChangeComplete: {
      type: Function as PropType<(value: AggregationColor) => void>,
      required: true,
    },
    mode: { type: String as PropType<ModeType>, required: true },
    onModeChange: { type: Function as PropType<(mode: ModeType) => void>, required: true },
    modeOptions: { type: Array as unknown as PropType<ModeOptions>, required: true },
    activeIndex: { type: Number, required: true },
    onActive: { type: Function as PropType<(index: number) => void>, required: true },
    gradientDragging: { type: Boolean, required: true },
    onGradientDragging: {
      type: Function as PropType<(dragging: boolean) => void>,
      required: true,
    },
    presets: { type: Array as unknown as PropType<PresetsItem[]>, default: undefined },
    panelRender: {
      type: Function as PropType<ColorPickerProps['panelRender']>,
      default: undefined,
    },
    format: { type: String as PropType<ColorFormatType>, default: undefined },
    onFormatChange: {
      type: Function as PropType<(format?: ColorFormatType) => void>,
      default: undefined,
    },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    allowClear: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    disabledAlpha: { type: Boolean, default: undefined },
    disabledFormat: { type: Boolean, default: undefined },
  },
  setup(props) {
    const pickerContext = computed<PanelPickerContextValue>(() => ({
      prefixCls: props.prefixCls,
      value: props.value,
      onChange: props.onChange,
      onClear: props.onClear,
      allowClear: props.allowClear,
      disabled: props.disabled,
      disabledAlpha: props.disabledAlpha,
      mode: props.mode,
      onModeChange: props.onModeChange,
      modeOptions: props.modeOptions,
      onChangeComplete: props.onChangeComplete,
      activeIndex: props.activeIndex,
      onActive: props.onActive,
      format: props.format,
      onFormatChange: props.onFormatChange,
      gradientDragging: props.gradientDragging,
      onGradientDragging: props.onGradientDragging,
      disabledFormat: props.disabledFormat,
    }));

    const presetsContext = computed<PanelPresetsContextValue>(() => ({
      prefixCls: props.prefixCls,
      value: props.value,
      presets: props.presets,
      onChange: (next: AggregationColor) => props.onChange(next),
    }));

    provide(panelPickerContextKey, pickerContext);
    provide(panelPresetsContextKey, presetsContext);

    /**
     * 🚨 **隔离 Form 上下文**（`KNOWN-ISSUES` §1.1）。
     *
     * 上游把面板包在 `<ContextIsolator form>` 里，而 `ContextIsolator` 的实现就是
     * `<NoFormStyle override status>`（`es/_util/ContextIsolator.js`）—— 本仓有现成对应物
     * `provideNoFormStyle({ override, status })`（`form/context.ts`）。
     *
     * 目的：面板**不该继承外层 Form.Item 的 `status`**（否则会多出 `-status-error` 一类）。
     * ⚠️ 放在 `ColorPickerPanel` 的 setup（**不是** `ColorPicker.vue`）—— 否则连**触发器**
     *    也会被隔离，那与上游不一致。
     * ⚠️ 当前面板里没有子件读它 ⇒ **行为等价、不是回归修复**；这条是**防将来分叉**，
     *    并由 L1 用例钉住（面板不出现 `-status-*` 类）。
     */
    provideNoFormStyle({ override: true, status: true });

    return (): VNodeChild => {
      const p = props.prefixCls;

      const innerChildren: VNodeChild[] = [h(PanelPicker)];
      // 判据 1
      if (Array.isArray(props.presets)) {
        innerChildren.push(h(Divider));
      }
      innerChildren.push(h(PanelPresets));

      const innerPanel = h('div', { class: `${p}-inner-content` }, innerChildren);

      const content = isFunction(props.panelRender)
        ? props.panelRender(innerPanel, {
            components: { Picker: PanelPicker, Presets: PanelPresets },
          } satisfies ColorPickerPanelRenderExtra)
        : innerPanel;

      return h('div', { class: `${p}-inner` }, [content]);
    };
  },
});

export default ColorPickerPanel;
