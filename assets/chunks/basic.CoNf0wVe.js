const n=`<script setup lang="ts">
// 对齐 antd 的 basic demo
import { Segmented } from '@apollo-design/ui';

const handleChange = (value: unknown) => {
  console.log(value);
};
<\/script>

<template>
  <Segmented
    :options="['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']"
    @change="handleChange"
  />
</template>
`;export{n as default};
