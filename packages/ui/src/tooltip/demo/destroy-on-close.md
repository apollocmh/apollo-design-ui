## zh-CN

关闭后销毁浮层。

## en-US

Destroy the popup when closed.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/destroy-on-close.tsx

import { Tooltip } from '@apollo-design/ui';
</script>

<template>
  <div style="font-family: sans-serif">
    <Tooltip destroy-on-hidden title="prompt text">
      <span>Dom will destroyed when Tooltip close</span>
    </Tooltip>
  </div>
</template>

```
