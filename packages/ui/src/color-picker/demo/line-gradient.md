---
order: 3
title:
  zh-CN: 渐变色
  en-US: Line Gradient
---

`mode` 决定面板支持单色还是渐变色（可多选）；渐变值形如 `[{ color, percent }]`。

```vue
<script setup lang="ts">
// 对齐 antd 的 line-gradient demo：用 `mode` 切换单色 / 渐变色。
import type { ColorPickerEmits } from '@apollo-design/ui';
import { ColorPicker, Space } from '@apollo-design/ui';

/** 上游 `Color`（= `AggregationColor`）：ui barrel 未导出该别名，从 `change` 的载荷反推。 */
type Color = Parameters<ColorPickerEmits['change']>[0];

const DEFAULT_COLOR = [
  { color: 'rgb(16, 142, 233)', percent: 0 },
  { color: 'rgb(135, 208, 104)', percent: 100 },
];

// 上游在 `onChangeComplete` 里 `console.log(color.toCssString())` —— 本仓同。
const onChangeComplete = (color: Color) => {
  console.log(color.toCssString());
};
</script>

<template>
  <Space vertical>
    <ColorPicker
      :default-value="DEFAULT_COLOR"
      allow-clear
      show-text
      :mode="['single', 'gradient']"
      @change-complete="onChangeComplete"
    />
    <ColorPicker
      :default-value="DEFAULT_COLOR"
      allow-clear
      show-text
      mode="gradient"
      @change-complete="onChangeComplete"
    />
  </Space>
</template>
```
