## zh-CN

请开启开发者模式查看浮层的调试样式。

## en-US

Please check the debug style of the popup with the developer mode.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/debug.tsx

import { Button, Flex, Tooltip } from '@apollo-design/ui';
import { h } from 'vue';
</script>

<template>
  <div style="font-family: sans-serif">
    <Flex vertical :gap="72" align="flex-start">
      <span />
      <Tooltip
        open
        title="Thanks for using antd. Have a nice day !"
        :arrow="{ pointAtCenter: true }"
        placement="topLeft"
      >
        <Button>Point at center</Button>
      </Tooltip>
      <Tooltip open :title="h('div')" placement="topLeft">
        <Button>Min Width</Button>
      </Tooltip>
      <Tooltip open :title="h('div')" placement="top">
        <Button>Min Width</Button>
      </Tooltip>
    </Flex>
  </div>
</template>

```
