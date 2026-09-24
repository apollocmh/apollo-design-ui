## zh-CN

包裹自定义组件（组件需要把事件与 ref 透传到根元素）。

## en-US

Wrap a custom component (events and ref must pass through to the root element).

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/wrap-custom-component.tsx

import { Tooltip } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif">
    <Tooltip title="prompt text">
      <span>This text is inside a component with the necessary events exposed.</span>
    </Tooltip>
  </div>
</template>

```
