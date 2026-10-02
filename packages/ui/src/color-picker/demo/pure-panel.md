---
order: 15
title:
  zh-CN: Pure Render
  en-US: Pure Panel
---

`ColorPickerPurePanel` 把面板**静态**渲染进文档流（不弹浮层），供文档 / 预览使用。

```vue
<script setup lang="ts">
// 对齐 antd 的 pure-panel demo：直接渲染**静态面板**（不弹浮层）。
//
// ⚠️ **两处 demo 级替换**（不是能力缺口）：
//   1. 上游用 `ColorPicker._InternalPanelDoNotUseOrYouWillBeFired` —— 本仓对应物是
//      具名导出的 `ColorPickerPurePanel`（`ColorPicker` 上仍挂了同名静态别名）。
//   2. 本仓 `PurePanel` 的入参走 `colorPickerProps` 对象（而不是把 props 摊平），
//      `value` / `onChange` 放在里面（语义与上游逐条对应）。
import type { ColorPickerEmits, ColorValueType } from '@apollo-design/ui';
import { ColorPickerPurePanel } from '@apollo-design/ui';
import { computed, ref } from 'vue';

/** 上游 `Color`（= `AggregationColor`）：ui barrel 未导出该别名，从 `change` 的载荷反推。 */
type Color = Parameters<ColorPickerEmits['change']>[0];

const color = ref<ColorValueType>('#1677ff');

const colorPickerProps = computed(() => ({
  value: color.value,
  onChange: (c: Color) => {
    color.value = c;
  },
}));
</script>

<template>
  <div :style="{ paddingInlineStart: '100px' }">
    <ColorPickerPurePanel :color-picker-props="colorPickerProps" />
  </div>
</template>
```
