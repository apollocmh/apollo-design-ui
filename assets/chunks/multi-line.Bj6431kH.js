const t=`<script setup lang="ts">
// 对齐 antd 的 multi-line demo
import { Watermark } from '@apollo-design/ui';
<\/script>

<template>
  <Watermark :content="['Ant Design', { text: 'Happy Working', font: { fontSize: 12 } }]">
    <div style="height: 500px" />
  </Watermark>
</template>
`;export{t as default};
