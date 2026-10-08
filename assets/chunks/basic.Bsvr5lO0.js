const A=`<script setup lang="ts">
// 对齐 antd demo/basic.tsx —— ⚠️ 图片用 data URI（外网图片会污染 L6 基线）
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
<\/script>

<template>
  <Image :width="200" alt="basic" :src="src" />
</template>
`;export{A as default};
