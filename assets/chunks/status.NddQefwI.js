const t=`<script setup lang="ts">
// 对齐 antd 的 demo/status.tsx
import { InputNumber } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px">
    <InputNumber placeholder="error" status="error" style="width: 200px" />
    <InputNumber placeholder="warning" status="warning" style="width: 200px" />
  </div>
</template>
`;export{t as default};
