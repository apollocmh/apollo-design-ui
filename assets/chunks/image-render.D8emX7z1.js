const A=`<script setup lang="ts">
// 对齐 antd demo/imageRender.tsx —— 语义等价（自定义 img 渲染）
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
<\/script>

<template>
  <Image alt="demo image" :width="200" :height="120" :src="src" :styles="{ image: { objectFit: 'cover' } }" />
</template>
`;export{A as default};
