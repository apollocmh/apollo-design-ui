const e=`<script setup lang="ts">
// 对齐 antd 的 demo/disabled-children.tsx（Select 未落地 ⇒ 原生 select 替换）

import { Checkbox, Input, InputNumber, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref(true);
const text = ref('hello');
const num = ref(3);
<\/script>

<template>
  <div style="font-family: sans-serif">
    <Tooltip title="prompt text">
      <Input v-model:value="text" placeholder="Input" :disabled="checked" style="width: 200px" />
    </Tooltip>
    <Tooltip title="prompt text">
      <InputNumber v-model:value="num" :disabled="checked" style="width: 120px" />
    </Tooltip>
    <Tooltip title="prompt text">
      <select disabled aria-label="demo select" style="width: 120px">
        <option>aa</option>
        <option>bb</option>
      </select>
    </Tooltip>
    <Checkbox v-model:checked="checked">Disabled</Checkbox>
  </div>
</template>
`;export{e as default};
