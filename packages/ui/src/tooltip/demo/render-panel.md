## zh-CN

以静态方式渲染面板（无触发元素）。

## en-US

Render the panel statically (no trigger element).

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/render-panel.tsx

import { Tooltip, TooltipPurePanel } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif">
    <TooltipPurePanel title="Hello, Pink Pure Panel!" color="pink" />
    <TooltipPurePanel title="Hello, Customize Color Pure Panel!" color="#f50" />
    <TooltipPurePanel title="Hello, Pure Panel!" placement="bottomLeft" :style="{ width: '200px' }" />
  </div>
</template>

```
