<script setup lang="ts">
/**
 * `ColorAlphaInput` —— alpha 百分数输入（antd `es/color-picker/components/ColorAlphaInput.js` 43 行）。
 *
 * ── 🚨 三条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **读的是 `toHsb()` 而不是 `toRgb()`**（与 `getColorAlpha` 同源）——
 *    在 hsb 输入路径上两者会分叉。
 * 2. **回写 `hsba.a = (step || 0) / 100`**（百分数 → 0–1）。
 * 3. **`formatter` 是 `${step}%`**（**不**走 `getRoundNumber`）—— 与 Hsb 那两个不同。
 */

import { computed, ref } from 'vue';
import type { InputNumberProps } from '../../input-number';
import type { AggregationColor } from '../color';
import { generateColor, getColorAlpha } from '../util';
import ColorSteppers from './ColorSteppers.vue';

interface ColorAlphaInputProps {
  prefixCls: string;
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
}

defineOptions({ name: 'AColorAlphaInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorAlphaInputProps>(), {
  value: undefined,
  onChange: undefined,
});

const internalValue = ref<AggregationColor>(generateColor(props.value || '#000'));
const alphaValue = computed(() => props.value || internalValue.value);

const handleAlphaChange = (step: number | null): void => {
  // 判据 1 + 2
  const hsba = alphaValue.value.toHsb();
  hsba.a = (step || 0) / 100;
  const genColor = generateColor(hsba);

  internalValue.value = genColor;

  props.onChange?.(genColor);
};

/** 判据 3。 */
const alphaFormatter: InputNumberProps['formatter'] = (step) => `${step}%`;
</script>

<template>
  <ColorSteppers
    :value="getColorAlpha(alphaValue)"
    :prefix-cls="prefixCls"
    :formatter="alphaFormatter"
    :class-name="`${prefixCls}-alpha-input`"
    @change="handleAlphaChange"
  />
</template>
