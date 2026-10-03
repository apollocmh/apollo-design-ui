---
order: 10
title:
  zh-CN: 颜色编码
  en-US: Color Format
---

`format` 控制输入区与文本的编码格式，支持 `hex` / `hsb` / `rgb`。

```vue
<script setup lang="ts">
// 对齐 antd 的 format demo：编码格式（HEX / HSB / RGB）。
//
// ⚠️ **一处 demo 级替换**：上游用 `useState` + `React.useMemo` 计算展示串；本仓用
//    `ref` + `computed`（同形）。`value` / `format` 走 `v-model:value` / `v-model:format`
//    的受控通道（C11 的双发）。
import type { ColorFormatType, ColorPickerColor } from '@apollo-design/ui';
import { ColorPicker, Space } from '@apollo-design/ui';
import { computed, ref } from 'vue';

/** 上游 `Color`（= `AggregationColor`）：ui barrel 未导出该别名，从 `change` 的载荷反推。 */
type Color = ColorPickerColor;

// ---- HEX ----
const colorHex = ref<Color | string>('#1677ff');
const formatHex = ref<ColorFormatType | undefined>('hex');
const hexString = computed(() =>
  typeof colorHex.value === 'string' ? colorHex.value : colorHex.value.toHexString(),
);

// ---- HSB ----
const colorHsb = ref<Color | string>('hsb(215, 91%, 100%)');
const formatHsb = ref<ColorFormatType | undefined>('hsb');
const hsbString = computed(() =>
  typeof colorHsb.value === 'string' ? colorHsb.value : colorHsb.value.toHsbString(),
);

// ---- RGB ----
const colorRgb = ref<Color | string>('rgb(22, 119, 255)');
const formatRgb = ref<ColorFormatType | undefined>('rgb');
const rgbString = computed(() =>
  typeof colorRgb.value === 'string' ? colorRgb.value : colorRgb.value.toRgbString(),
);
</script>

<template>
  <Space vertical size="medium" :style="{ display: 'flex' }">
    <Space>
      <ColorPicker v-model:value="colorHex" v-model:format="formatHex" />
      <span>HEX: {{ hexString }}</span>
    </Space>
    <Space>
      <ColorPicker v-model:value="colorHsb" v-model:format="formatHsb" />
      <span>HSB: {{ hsbString }}</span>
    </Space>
    <Space>
      <ColorPicker v-model:value="colorRgb" v-model:format="formatRgb" />
      <span>RGB: {{ rgbString }}</span>
    </Space>
  </Space>
</template>
```
