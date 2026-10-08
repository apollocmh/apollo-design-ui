const a=`<script setup lang="ts">
// 对齐 antd demo/fallback.tsx
import { Image } from '@apollo-design/ui';

const fallback =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
<\/script>

<template>
  <Image :width="200" :height="200" alt="fallback image" src="error" :fallback="fallback" />
</template>
`;export{a as default};
