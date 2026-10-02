<script setup lang="ts">
/**
 * `ColorHexInput` —— HEX 输入框（antd `es/color-picker/components/ColorHexInput.js` 50 行）。
 *
 * ```html
 * <span class="{p}-hex-input {p}-input-affix-wrapper"> … <input/> </span>
 * ```
 *
 * ── 🚨 三条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **合法性判据是 `isHexString(toHexFormat(originValue, true))`** —— 先按
 *    **8 位**（含 alpha）归一，再判 `^#[\da-f]{6}$ | ^#[\da-f]{8}$`。
 *    ⚠️ 正则里的 `#` 是**函数自己补的**（`hexReg.test('#' + hex)`），所以输入里
 *    不带 `#` 也能通过。
 * 2. **`hexValue` 只显示 6 位**（`toHexFormat(value.toHexString())`，alpha 参数缺省 false）
 *    —— 显示与合法性判据**用的不是同一个宽度**。
 * 3. **`onChange` 发的是 `generateColor(originValue)`**（用户**原始**输入，不是归一后的
 *    6 位串）⇒ 用户输入 `#273B57FF` 时 alpha 会被带上。
 */

import { ref, watch } from 'vue';
import Input from '../../input';
import type { AggregationColor } from '../color';
import { toHexFormat } from '../color';
import { generateColor } from '../util';

interface ColorHexInputProps {
  prefixCls: string;
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
}

defineOptions({ name: 'AColorHexInput', inheritAttrs: false });

const props = withDefaults(defineProps<ColorHexInputProps>(), {
  value: undefined,
  onChange: undefined,
});

const hexReg = /(^#[\da-f]{6}$)|(^#[\da-f]{8}$)/i;
/** 判据 1：`#` 由函数补。 */
const isHexString = (hex?: string): boolean => hexReg.test(`#${hex}`);

const hexValue = ref<string | undefined>(
  props.value ? toHexFormat(props.value.toHexString()) : undefined,
);

// 判据 2：外部值变化时同步（只显示 6 位）
watch(
  () => props.value,
  (next) => {
    if (next) {
      hexValue.value = toHexFormat(next.toHexString());
    }
  },
);

const handleHexChange = (event: Event): void => {
  const originValue = (event.target as HTMLInputElement).value;
  hexValue.value = toHexFormat(originValue);
  if (isHexString(toHexFormat(originValue, true))) {
    // 判据 3：发原始输入
    props.onChange?.(generateColor(originValue));
  }
};
</script>

<template>
  <Input
    :class-name="`${prefixCls}-hex-input`"
    :value="hexValue"
    prefix="#"
    size="small"
    @change="handleHexChange"
  />
</template>
