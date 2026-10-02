---
order: 8
title:
  zh-CN: 自定义触发器
  en-US: Custom Trigger
---

`children`（默认插槽）可完全替换内置触发器。

```vue
<script setup lang="ts">
// 对齐 antd 的 trigger demo：用**默认插槽**自定义触发器（本仓 `children` 走默认插槽）。
import type { ColorPickerEmits } from '@apollo-design/ui';
import { Button, ColorPicker } from '@apollo-design/ui';
import { computed, ref } from 'vue';

/** 上游 `Color`（= `AggregationColor`）：ui barrel 未导出该别名，从 `change` 的载荷反推。 */
type Color = Parameters<ColorPickerEmits['change']>[0];

// ⚠️ 收窄成 `Color | string`（上游 demo 的 `Extract<…, string | {cleared}>` 同判）：
//    `ColorValueType` 还含 `null` / 渐变数组，它们没有 `toHexString()`。
const color = ref<Color | string>('#1677ff');

const bgColor = computed(() =>
  typeof color.value === 'string' ? color.value : color.value.toHexString(),
);

const onChange = (c: Color) => {
  color.value = c;
};
</script>

<template>
  <ColorPicker :value="color" @change="onChange">
    <Button type="primary" :style="{ backgroundColor: bgColor }">open</Button>
  </ColorPicker>
</template>
```
