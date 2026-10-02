<script setup lang="ts">
/**
 * `ColorInput` —— 面板底部的输入区（antd `es/color-picker/components/ColorInput.js` 78 行）。
 *
 * ```html
 * <div class="{p}-input-container">
 *   <Select class="{p}-format-select" …/>        ← disabledFormat 时不渲染
 *   <div class="{p}-input">
 *     <ColorHexInput | ColorRgbInput | ColorHsbInput />   ← 由 format 决定
 *   </div>
 *   <ColorAlphaInput />                          ← disabledAlpha 时不渲染
 * </div>
 * ```
 *
 * ── 🚨 三条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **格式是「受控 + 内部兜底」**：`useControlledState(FORMAT_HEX, format)`
 *    ⇒ `format` 未传时自己维护（切了下拉框就变）。
 * 2. **`disabledFormat` 只去掉下拉框**，输入件仍在（用户改不了格式，但能改值）。
 * 3. **`Select` 的 `getPopupContainer` 是恒等函数** `(current) => current`
 *    —— 下拉框挂在**自己**的容器里（面板内），不是 body。这条是面板能用键盘
 *    操作的前提，照抄。
 */

import { computed, ref, watch } from 'vue';
import type { DefaultOptionType } from '../../select';
import Select from '../../select';
import type { AggregationColor } from '../color';
import type { ColorFormatType } from '../interface';
import { FORMAT_HEX, FORMAT_HSB, FORMAT_RGB } from '../interface';
import ColorAlphaInput from './ColorAlphaInput.vue';
import ColorHexInput from './ColorHexInput.vue';
import ColorHsbInput from './ColorHsbInput.vue';
import ColorRgbInput from './ColorRgbInput.vue';

interface ColorInputProps {
  prefixCls: string;
  format?: ColorFormatType;
  onFormatChange?: (format: ColorFormatType) => void;
  disabledAlpha?: boolean;
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
  disabledFormat?: boolean;
}

defineOptions({ name: 'AColorInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorInputProps>(), {
  format: undefined,
  onFormatChange: undefined,
  disabledAlpha: undefined,
  value: undefined,
  onChange: undefined,
  disabledFormat: undefined,
});

const selectOptions: DefaultOptionType[] = [FORMAT_HEX, FORMAT_HSB, FORMAT_RGB].map((format) => ({
  value: format,
  label: format.toUpperCase(),
}));

/** 判据 1：受控 + 内部兜底。 */
const innerFormat = ref<ColorFormatType>(FORMAT_HEX);
watch(
  () => props.format,
  (next) => {
    if (next !== undefined) {
      innerFormat.value = next;
    }
  },
);
const colorFormat = computed<ColorFormatType>(() => props.format ?? innerFormat.value);

const triggerFormatChange = (newFormat: ColorFormatType): void => {
  innerFormat.value = newFormat;
  props.onFormatChange?.(newFormat);
};

/** 判据 3：下拉框挂在自己容器里。 */
const getPopupContainer = (current: HTMLElement): HTMLElement => current;

/** `Select` 的 `change` 载荷是 `SelectValue`（宽）⇒ 形参写 `unknown` 再收窄。 */
const onSelectFormatChange = (value: unknown): void => {
  triggerFormatChange(value as ColorFormatType);
};

const steppersComponent = computed(() => {
  switch (colorFormat.value) {
    case FORMAT_HSB:
      return ColorHsbInput;
    case FORMAT_RGB:
      return ColorRgbInput;
    default:
      return ColorHexInput;
  }
});

const inputProps = computed(() => ({
  prefixCls: props.prefixCls,
  value: props.value,
  onChange: props.onChange,
}));
</script>

<template>
  <div :class="`${prefixCls}-input-container`">
    <Select
      v-if="!disabledFormat"
      :value="colorFormat"
      variant="borderless"
      :get-popup-container="getPopupContainer"
      :popup-match-select-width="68"
      placement="bottomRight"
      :class-name="`${prefixCls}-format-select`"
      size="small"
      :options="selectOptions"
      @change="onSelectFormatChange"
    />
    <div :class="`${prefixCls}-input`">
      <component :is="steppersComponent" v-bind="inputProps" />
    </div>
    <ColorAlphaInput
      v-if="!disabledAlpha"
      :prefix-cls="prefixCls"
      :value="value"
      :on-change="onChange"
    />
  </div>
</template>
