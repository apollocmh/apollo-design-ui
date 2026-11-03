---
order: 108
---
## zh-CN

触发元素被禁用时，仍可显示提示。

## en-US

The tooltip can still be shown when the trigger element is disabled.

```vue
<script setup lang="ts">
import { Checkbox, Input, InputNumber, Select, Space, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref(true);
const text = ref('hello');
const num = ref(3);
const value = ref('aa');
</script>

<template>
  <Space wrap :size="12">
    <Tooltip title="prompt text">
      <Input v-model:value="text" placeholder="Input" :disabled="checked" style="width: 200px" />
    </Tooltip>
    <Tooltip title="prompt text">
      <InputNumber v-model:value="num" :disabled="checked" style="width: 120px" />
    </Tooltip>
    <Tooltip title="prompt text">
      <Select v-model:value="value" :disabled="checked" aria-label="demo select" :options="[{ value: 'aa', label: 'aa' }, { value: 'bb', label: 'bb' }]" style="width: 120px" />
    </Tooltip>
    <Checkbox v-model:checked="checked">Disabled</Checkbox>
  </Space>
</template>
```
