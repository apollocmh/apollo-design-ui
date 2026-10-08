const t=`<script setup lang="ts">
// 对齐 antd 的 demo/style-class.tsx：语义化样式与类
import { InputNumber } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif">
    <InputNumber
      :default-value="1"
      :styles="{ root: { width: '200px' }, input: { color: 'rgb(19, 116, 246)' } }"
    />
  </div>
</template>
`;export{t as default};
