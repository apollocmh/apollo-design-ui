const A=`<script setup lang="ts">
// 对齐 antd demo/preview-mask.tsx —— mask 形态（含 blur）
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
<\/script>

<template>
  <Image alt="demo image" :width="200" :src="src" :preview="{ mask: { blur: true } }" />
</template>
`;export{A as default};
