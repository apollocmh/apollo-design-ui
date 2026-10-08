const t=`<script setup lang="ts">
// 对齐 antd 的 demo/presuffix.tsx
import { InputNumber } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif; display: flex; flex-direction: column; gap: 8px">
    <InputNumber prefix="$" suffix="USD" style="width: 200px" />
    <InputNumber suffix="%" style="width: 200px" />
  </div>
</template>
`;export{t as default};
