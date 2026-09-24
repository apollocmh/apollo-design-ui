## zh-CN

进行编辑操作时提示某些内容。

## en-US

Prompt something while editing.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/disabled.tsx

import { ref } from 'vue';
import { Button, Tooltip } from '@apollo-design/ui';

const disabled = ref(true);
</script>

<template>
  <div style="font-family: sans-serif">
    <Tooltip :title="disabled ? null : 'prompt text'">
      <Button @click="disabled = !disabled">{{ disabled ? 'Enable' : 'Disable' }}</Button>
    </Tooltip>
  </div>
</template>

```
