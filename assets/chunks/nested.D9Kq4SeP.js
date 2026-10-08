const A=`<script setup lang="ts">
// 对齐 antd demo/nested.tsx —— 浮层挂 portal，不受父容器 overflow 影响
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
<\/script>

<template>
  <div style="overflow: hidden; width: 200px; height: 120px">
    <Image alt="demo image" :width="200" :height="120" :src="src" />
  </div>
</template>
`;export{A as default};
