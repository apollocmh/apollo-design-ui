---
order: 110
---
## zh-CN

静态面板无需触发元素。切换、更新或清空原生 `#title`，验证空槽覆盖 prop，移除槽才恢复标题数据。

## en-US

Static panels need no trigger. Toggle, update or empty the native title slot. Empty slots override the prop; removing the slot restores the title data.

```vue
<script setup lang="ts">
import { TooltipPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(false);
const empty = ref(false);
const count = ref(0);
</script>

<template>
  <div style="font-family: sans-serif">
    <p>
      <button @click="show = !show">Toggle tooltip title</button>
      <button @click="empty = !empty">Empty tooltip title</button>
      <button @click="count++">Update tooltip title</button>
    </p>
    <TooltipPurePanel title="Hello, Pink Pure Panel!" color="pink" />
    <TooltipPurePanel title="Hello, Customize Color Pure Panel!" color="#f50" />
    <TooltipPurePanel data-native-tooltip-panel title="Hello, Pure Panel!" placement="bottomLeft" :style="{ width: '200px' }">
      <template v-if="show" #title><strong v-if="!empty">Native tooltip {{ count }}</strong></template>
    </TooltipPurePanel>
  </div>
</template>

```
