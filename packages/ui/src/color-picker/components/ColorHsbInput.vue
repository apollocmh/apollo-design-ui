<script setup lang="ts">
/**
 * `ColorHsbInput` —— HSB 三档输入（antd `es/color-picker/components/ColorHsbInput.js` 66 行）。
 *
 * ── 🚨 三条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **通道量纲不同**：`h` 是**角度**（0–360，原样），`s` / `b` 是**百分数**（0–100，
 *    回写时 **`/ 100`**）。三个 `ColorSteppers` 的 `max` 也因此不同（360 / 100 / 100）。
 * 2. **显示值要把 s / b 乘回 100**（`Number(hsbValue.toHsb().s) * 100`）。
 * 3. **`formatter` 加了 `%` 后缀**（h 档不加），且走 `getRoundNumber`（四舍五入）。
 */

import { computed, ref } from 'vue';
import type { InputNumberProps } from '../../input-number';
import type { AggregationColor } from '../color';
import type { HSB } from '../engine/interface';
import { generateColor, getRoundNumber } from '../util';
import ColorSteppers from './ColorSteppers.vue';

interface ColorHsbInputProps {
  prefixCls: string;
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
}

defineOptions({ name: 'AColorHsbInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorHsbInputProps>(), {
  value: undefined,
  onChange: undefined,
});

const internalValue = ref<AggregationColor>(generateColor(props.value || '#000'));
const hsbValue = computed(() => props.value || internalValue.value);

const handleHsbChange = (step: number | null, type: keyof HSB): void => {
  const hsb = hsbValue.value.toHsb();
  // 判据 1：只有 h 是角度
  hsb[type] = type === 'h' ? (step ?? 0) : (step || 0) / 100;
  const genColor = generateColor(hsb);

  internalValue.value = genColor;

  props.onChange?.(genColor);
};

const onHueChange = (step: number | null): void => handleHsbChange(step, 'h');
const onSaturationChange = (step: number | null): void => handleHsbChange(step, 's');
const onBrightnessChange = (step: number | null): void => handleHsbChange(step, 'b');

/** 判据 3。 */
const angleFormatter: InputNumberProps['formatter'] = (step) =>
  getRoundNumber(Number(step) || 0).toString();
const percentFormatter: InputNumberProps['formatter'] = (step) =>
  `${getRoundNumber(Number(step) || 0)}%`;
</script>

<template>
  <div :class="`${prefixCls}-hsb-input`">
    <ColorSteppers
      :max="360"
      :min="0"
      :value="Number(hsbValue.toHsb().h)"
      :prefix-cls="prefixCls"
      :class-name="`${prefixCls}-hsb-input`"
      :formatter="angleFormatter"
      @change="onHueChange"
    />
    <ColorSteppers
      :max="100"
      :min="0"
      :value="Number(hsbValue.toHsb().s) * 100"
      :prefix-cls="prefixCls"
      :class-name="`${prefixCls}-hsb-input`"
      :formatter="percentFormatter"
      @change="onSaturationChange"
    />
    <ColorSteppers
      :max="100"
      :min="0"
      :value="Number(hsbValue.toHsb().b) * 100"
      :prefix-cls="prefixCls"
      :class-name="`${prefixCls}-hsb-input`"
      :formatter="percentFormatter"
      @change="onBrightnessChange"
    />
  </div>
</template>
