<script setup lang="ts">
/**
 * `ColorRgbInput` —— RGB 三档数字输入（antd `es/color-picker/components/ColorRgbInput.js` 63 行）。
 *
 * ── 🚨 三条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **`internalValue` 是 `value` 缺失时的兜底**（`value || internalValue`，初始 `#000`）。
 * 2. **改一个通道时读的是 `rgbValue.toRgb()`**（当前值的 rgb），再覆盖那一个通道
 *    ⇒ 不会丢掉另外两个通道与 alpha。
 * 3. **`rgb[type] = step || 0`** —— `null`（清空输入框）归成 `0`，不是 `NaN`。
 */

import { computed, ref } from 'vue';
import type { AggregationColor } from '../color';
import type { RGB } from '../engine/interface';
import { generateColor } from '../util';
import ColorSteppers from './ColorSteppers.vue';

interface ColorRgbInputProps {
  prefixCls: string;
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
}

defineOptions({ name: 'AColorRgbInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorRgbInputProps>(), {
  value: undefined,
  onChange: undefined,
});

/** 判据 1。 */
const internalValue = ref<AggregationColor>(generateColor(props.value || '#000'));
const rgbValue = computed(() => props.value || internalValue.value);

const handleRgbChange = (step: number | null, type: keyof RGB): void => {
  const rgb = rgbValue.value.toRgb();
  // 判据 3
  rgb[type] = step || 0;
  const genColor = generateColor(rgb);

  internalValue.value = genColor;

  props.onChange?.(genColor);
};

const onRedChange = (step: number | null): void => handleRgbChange(step, 'r');
const onGreenChange = (step: number | null): void => handleRgbChange(step, 'g');
const onBlueChange = (step: number | null): void => handleRgbChange(step, 'b');
</script>

<template>
  <div :class="`${prefixCls}-rgb-input`">
    <ColorSteppers
      :max="255"
      :min="0"
      :value="Number(rgbValue.toRgb().r)"
      :prefix-cls="prefixCls"
      :class-name="`${prefixCls}-rgb-input`"
      @change="onRedChange"
    />
    <ColorSteppers
      :max="255"
      :min="0"
      :value="Number(rgbValue.toRgb().g)"
      :prefix-cls="prefixCls"
      :class-name="`${prefixCls}-rgb-input`"
      @change="onGreenChange"
    />
    <ColorSteppers
      :max="255"
      :min="0"
      :value="Number(rgbValue.toRgb().b)"
      :prefix-cls="prefixCls"
      :class-name="`${prefixCls}-rgb-input`"
      @change="onBlueChange"
    />
  </div>
</template>
