## zh-CN

需要soc 弹出层跟随的触发元素被禁用时，依然可以显示提示。

## en-US

The tooltip can still be shown when the trigger element is disabled.

```vue
<script setup lang="ts">
// 对齐 antd 的 demo/disabled-children.tsx（Select 未落地 ⇒ 原生 select 替换）

import { ref } from 'vue';
import { Checkbox, Input, InputNumber, Tooltip } from '@apollo-design/ui';

const checked = ref(true);
const text = ref('hello');
const num = ref(3);
</script>

<template>
  <div style="font-family: sans-serif">
    <Tooltip title="prompt text">
      <Input v-model:value="text" placeholder="Input" :disabled="checked" style="width: 200px" />
    </Tooltip>
    <Tooltip title="prompt text">
      <InputNumber v-model:value="num" :disabled="checked" style="width: 120px" />
    </Tooltip>
    <Tooltip title="prompt text">
      <select disabled style="width: 120px">
        <option>aa</option>
        <option>bb</option>
      </select>
    </Tooltip>
    <Checkbox v-model:checked="checked">Disabled</Checkbox>
  </div>
</template>

```
