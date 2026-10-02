<script setup lang="ts">
/**
 * `ColorSteppers` —— 面板里的数字输入（antd `es/color-picker/components/ColorSteppers.js` 49 行）。
 *
 * 是 `InputNumber` 的薄壳，只做三件事：加 `-steppers` 类名、`size="small"`、
 * 维护一个「value 是 NaN 时用」的内部值。
 *
 * ── 🚨 三条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **`Number.isNaN(value)` 不是 `value == null`**：`Number.isNaN(undefined)` 是 **`false`**
 *    ⇒ `value` 未传时 `stepValue = undefined`（**不是** `internalValue`）⇒ `InputNumber`
 *    退化成非受控。照抄，别"顺手改成更合理的 `??`"。
 * 2. **`onChange` 先写内部值再回调**，且 `setInternalValue(step || 0)` 会把 `null` 归成 `0`。
 * 3. **`formatter` 原样透传**（Hsb / Alpha 两个输入件靠它加 `%` 后缀）。
 */

import { computed, ref } from 'vue';
import InputNumber, { type InputNumberProps } from '../../input-number';

interface ColorSteppersProps {
  prefixCls: string;
  value?: number;
  min?: number;
  max?: number;
  onChange?: (value: number | null) => void;
  className?: string;
  formatter?: InputNumberProps['formatter'];
}

defineOptions({ name: 'AColorSteppers', inheritAttrs: false });

const props = withDefaults(defineProps<ColorSteppersProps>(), {
  value: undefined,
  min: 0,
  max: 100,
  onChange: undefined,
  className: undefined,
  formatter: undefined,
});

const internalValue = ref<number | undefined>(0);

/** 判据 1。 */
const stepValue = computed(() => (!Number.isNaN(props.value) ? props.value : internalValue.value));

const onInternalChange = (step: number | null): void => {
  // 判据 2
  internalValue.value = step || 0;
  props.onChange?.(step);
};
</script>

<template>
  <!-- ⚠️ 必须传 `className` prop：本仓 `InputNumber` 会剥掉 `attrs.class`（PITFALLS 309） -->
  <InputNumber
    :class-name="[`${prefixCls}-steppers`, className].filter(Boolean).join(' ')"
    :min="min"
    :max="max"
    :value="stepValue"
    :formatter="formatter"
    size="small"
    @change="onInternalChange"
  />
</template>
