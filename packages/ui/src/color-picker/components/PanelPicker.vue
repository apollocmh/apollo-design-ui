<script setup lang="ts">
/**
 * `PanelPicker` —— 面板主体（antd `es/color-picker/components/PanelPicker/index.tsx` 213 行）。
 *
 * ```html
 * <div class="{p}-operation">            ← allowClear || 多模式 时才有
 *   <Segmented/>                          ← modeOptions.length > 1 时才有
 *   <ColorClear/>
 * </div>
 * <GradientColorBar/>                     ← mode === 'gradient' 时才有内容
 * <EngineColorPicker/>                    ← 引擎面板（HSB 取色区 + 两条滑块 + 色块）
 * <ColorInput/>                           ← 格式下拉 + 数字输入 + alpha 输入
 * ```
 *
 * ── 🚨 六条判据（顺序与分支都是语义）──────────────────────────────────────────
 *
 * 1. **`colors` 在 `cleared` 时是「两段透明黑」**（`[0% 空, 100% 空]`）——
 *    不是 `getColors()`（那会返回 1 段）。这样渐变条在清空后仍有两个可拖的点。
 * 2. **`lockedColor` 只在「非单色」时同步**，且 `gradientDragging` 期间
 *    `activeColor` **用 `lockedColor`**（用户拖点时不能读被实时改写的外部值，
 *    否则手柄会跳）—— 这是本组件最绕的一处。
 * 3. **`mergedPickerColor` 的判据是「内部值是否等于外部值」**：相等 ⇒ 用**外部值**
 *    （让外部变化生效）；不等 ⇒ 用**内部值**（拖拽中，外部回流不能盖掉）。
 * 4. **`fillColor` 的「清空后补色」有两支**：`rgb` 全 0 **且**有 `info` ⇒ 按 info 造
 *    「满饱和满亮度」的色（hue 用 info.value / alpha 用 info.value/100）；
 *    否则 `genAlphaColor`（把 alpha 拉回 1）。
 * 5. **`onInternalChangeComplete` 里 `setForceSync()` 在最后** —— 上游注释：
 *    放在 `onChangeComplete` 之前会让 `fillColor` 读到错的 `color.cleared`。
 * 6. 🚨 **`injectProps` 不能整体透传**（Vue 会把未声明的键落到 DOM；React 会丢弃）
 *    ⇒ 只传目标组件**声明过**的键（PITFALLS 16）。
 */

import { computed, inject, ref, watch } from 'vue';
import Segmented from '../../segmented';
import { AggregationColor, type GradientColor } from '../color';
import { panelPickerContextKey } from '../context';
import type { Color as EngineColor } from '../engine/color';
import EngineColorPicker from '../engine/color-picker';
import { genAlphaColor, generateColor } from '../util';
import ColorClear from './ColorClear.vue';
import ColorInput from './ColorInput.vue';
import SingleColorSlider from './ColorSlider';
import GradientColorBar from './GradientColorBar';

defineOptions({ name: 'AColorPanelPicker', inheritAttrs: false });

/** `fillColor` 的第二个参数（只有两条滑块会传）。 */
interface Info {
  type?: 'hue' | 'alpha';
  value?: number;
}

const context = inject(panelPickerContextKey, undefined);

const prefixCls = computed(() => context?.value.prefixCls ?? 'apollo-color-picker');
const value = computed(() => context?.value.value ?? generateColor(''));
const mode = computed(() => context?.value.mode ?? 'single');
const modeOptions = computed(() => context?.value.modeOptions ?? []);
const allowClear = computed(() => context?.value.allowClear);
const disabled = computed(() => context?.value.disabled);
const disabledAlpha = computed(() => context?.value.disabledAlpha);
const format = computed(() => context?.value.format);
const disabledFormat = computed(() => context?.value.disabledFormat);
const activeIndex = computed(() => context?.value.activeIndex ?? 0);
const gradientDragging = computed(() => context?.value.gradientDragging ?? false);

const onChange = (next: AggregationColor, pickColor?: boolean): void => {
  context?.value.onChange(next, pickColor);
};
const onChangeComplete = (next: AggregationColor): void => {
  context?.value.onChangeComplete(next);
};
const onModeChange = (next: string | number | boolean): void => {
  context?.value.onModeChange(next as never);
};
const onActive = (index: number): void => {
  context?.value.onActive(index);
};
const onGradientDragging = (dragging: boolean): void => {
  context?.value.onGradientDragging(dragging);
};
const onFormatChange = (next: string | undefined): void => {
  context?.value.onFormatChange?.(next as never);
};

// ============================ Colors ============================
/** 判据 1。 */
const colors = computed<GradientColor>(() => {
  const current = value.value;
  if (!current.cleared) {
    return current.getColors();
  }

  return [
    { percent: 0, color: new AggregationColor('') },
    { percent: 100, color: new AggregationColor('') },
  ];
});

const isSingle = computed(() => !value.value.isGradient());

// ========================= Single Color =========================
/** 判据 2：拖拽期间的锁定色。 */
const lockedColor = ref<AggregationColor | undefined>(value.value);

watch([isSingle, colors, gradientDragging, activeIndex], () => {
  if (!isSingle.value) {
    const next = colors.value[activeIndex.value]?.color;
    if (next) {
      lockedColor.value = next;
    }
  }
});

const activeColor = computed<AggregationColor | undefined>(() => {
  if (isSingle.value) {
    return value.value;
  }
  // 拖拽时用缓存（用户拖拽期间不能操作面板）
  if (gradientDragging.value) {
    return lockedColor.value;
  }
  return colors.value[activeIndex.value]?.color;
});

// ========================= Picker Color =========================
const pickerColor = ref<AggregationColor | undefined>(activeColor.value);
/** `useForceUpdate` 的 Vue 等价物（自增一个 ref 让 watch 重跑）。 */
const forceSync = ref(0);

/** 判据 3。 */
const mergedPickerColor = computed(() => {
  const internal = pickerColor.value;
  return internal?.equals(activeColor.value ?? null) ? activeColor.value : internal;
});

watch([() => forceSync.value, () => activeColor.value?.toHexString()], () => {
  pickerColor.value = activeColor.value;
});

// ============================ Change ============================
/** 判据 4。 */
const fillColor = (nextColor: AggregationColor | EngineColor, info?: Info): AggregationColor => {
  let submitColor = generateColor(nextColor);

  if (value.value.cleared) {
    const rgb = submitColor.toRgb();

    // 源色是 `0/0/0` 时按 info 自动补色（提升体验）
    if (!rgb.r && !rgb.g && !rgb.b && info) {
      const { type: infoType, value: infoValue = 0 } = info;

      submitColor = new AggregationColor({
        h: infoType === 'hue' ? infoValue : 0,
        s: 1,
        b: 1,
        a: infoType === 'alpha' ? infoValue / 100 : 1,
      });
    } else {
      submitColor = genAlphaColor(submitColor);
    }
  }

  if (mode.value === 'single') {
    return submitColor;
  }

  const nextColors = [...colors.value];
  const target = nextColors[activeIndex.value];
  if (target) {
    nextColors[activeIndex.value] = { ...target, color: submitColor };
  }

  return new AggregationColor(nextColors);
};

const onPickerChange = (
  colorValue: AggregationColor | EngineColor,
  fromPicker: boolean,
  info?: Info,
): void => {
  const nextColor = fillColor(colorValue, info);
  pickerColor.value = nextColor.isGradient()
    ? (nextColor.getColors()[activeIndex.value]?.color ?? nextColor)
    : nextColor;
  onChange(nextColor, fromPicker);
};

/** 判据 5。 */
const onInternalChangeComplete = (nextColor: EngineColor, info?: Info): void => {
  onChangeComplete(fillColor(nextColor, info));

  // 受控时把值回滚到外部（放在 `onChangeComplete` **之后**，避免 `fillColor`
  // 读到错的 `color.cleared`）
  forceSync.value += 1;
};

const onInputChange = (colorValue: AggregationColor): void => {
  onChange(fillColor(colorValue));
};

/** 引擎面板的 `onChange` 恒带 `fromPicker = true`（上游在调用点写死）。 */
const onEngineChange = (colorValue: EngineColor, info?: Info): void => {
  onPickerChange(colorValue, true, info);
};

// ============================ Render ============================
const showMode = computed(() => modeOptions.value.length > 1);
const showOperation = computed(() => !!allowClear.value || showMode.value);

const onClearClick = (clearColor: AggregationColor): void => {
  onChange(clearColor);
  context?.value.onClear?.();
};
</script>

<template>
  <div v-if="showOperation" :class="`${prefixCls}-operation`">
    <Segmented
      v-if="showMode"
      size="small"
      :options="modeOptions"
      :value="mode"
      @change="onModeChange"
    />
    <ColorClear
      :prefix-cls="prefixCls"
      :value="value"
      :disabled="disabled"
      @change="onClearClick"
    />
  </div>

  <GradientColorBar
    :prefix-cls="prefixCls"
    :mode="mode"
    :colors="colors"
    :active-index="activeIndex"
    :on-change="onChange"
    :on-change-complete="onChangeComplete"
    :on-active="onActive"
    :on-gradient-dragging="onGradientDragging"
  />

  <EngineColorPicker
    :prefix-cls="prefixCls"
    :value="mergedPickerColor?.toHsb()"
    :disabled="disabled"
    :disabled-alpha="disabledAlpha"
    :slider="SingleColorSlider"
    :on-change="onEngineChange"
    :on-change-complete="onInternalChangeComplete"
  />

  <ColorInput
    :prefix-cls="prefixCls"
    :value="activeColor"
    :disabled-alpha="disabledAlpha"
    :format="format"
    :disabled-format="disabledFormat"
    :on-format-change="onFormatChange"
    :on-change="onInputChange"
  />
</template>
