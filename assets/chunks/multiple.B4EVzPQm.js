const e=`<script setup lang="ts">
// 对齐 antd 的「多把手」用法：\`count\` 决定把手数量（\`range\` 开启后不足的用最后一个值补齐）。
import { Slider } from '@apollo-design/ui';
<\/script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Slider :default-value="[10, 30, 60]" :count="3" range />
    <Slider :default-value="30" :count="5" range />
  </div>
</template>
`;export{e as default};
