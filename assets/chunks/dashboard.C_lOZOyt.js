const e=`<script setup lang="ts">
// 对齐 antd demo/dashboard.tsx（antd 用 Segmented —— 本仓未落地，InputNumber 等价替换，
// segmented 落地后换回；README §2 登记）
import { Flex, InputNumber, Progress } from '@apollo-design/ui';
import { ref } from 'vue';

const gapDegree = ref<number>(50);
const gapPlacement = ref<'start' | 'end' | 'top' | 'bottom'>('bottom');
<\/script>

<template>
  <Flex vertical gap="large">
    <div>
      gapDegree:
      <InputNumber v-model:value="gapDegree" :min="0" :max="360" :step="50" aria-label="gapDegree" style="width: 100px" />
    </div>
    <div>
      gapPlacement:
      <select v-model="gapPlacement" aria-label="gapPlacement" style="width: 120px">
        <option value="start">start</option>
        <option value="end">end</option>
        <option value="top">top</option>
        <option value="bottom">bottom</option>
      </select>
    </div>
    <Progress type="dashboard" :gap-degree="gapDegree" :percent="30" :gap-placement="gapPlacement" />
  </Flex>
</template>
`;export{e as default};
