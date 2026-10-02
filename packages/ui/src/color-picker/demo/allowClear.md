---
order: 7
title:
  zh-CN: 清除颜色
  en-US: Clear Color
---

`allowClear` 在面板操作条与触发器上给出清空入口；清空后触发器渲染成透明棋盘格。

```vue
<script setup lang="ts">
// 对齐 antd 的 allowClear demo：受控值 + 清空按钮。
//
// ⚠️ **一处 demo 级替换**：上游 `value` 收 `string`、`onChange` 里 `c.toHexString()` 回写
//    —— 本仓 `value` 走 `:value` + `@change` 的受控通道（C11），语义逐字对应。
import type { ColorPickerEmits } from '@apollo-design/ui';
import { ColorPicker } from '@apollo-design/ui';
import { ref } from 'vue';

/** 上游 `Color`（= `AggregationColor`）：ui barrel 未导出该别名，从 `change` 的载荷反推。 */
type Color = Parameters<ColorPickerEmits['change']>[0];

const color = ref<string>('#1677ff');

const onChange = (c: Color) => {
  color.value = c.toHexString();
};
</script>

<template>
  <ColorPicker :value="color" allow-clear @change="onChange" />
</template>
```
