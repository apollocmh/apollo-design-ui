const e=`<script setup lang="ts">
// 对齐 antd 的 demo/keyboard.tsx：keyboard=false 关闭键盘步进
import { InputNumber } from '@apollo-design/ui';
<\/script>

<template>
  <div style="font-family: sans-serif">
    <InputNumber :keyboard="false" :min="1" :max="10" style="width: 120px" />
  </div>
</template>
`;export{e as default};
