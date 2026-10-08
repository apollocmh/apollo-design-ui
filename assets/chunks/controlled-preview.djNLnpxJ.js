const n=`<script setup lang="ts">
// 对齐 antd demo/controlled-preview.tsx
import { Image } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
<\/script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 8px; align-items: flex-start">
    <button @click="open = !open">{{ open ? 'close' : 'open' }}</button>
    <Image alt="demo image"
      :width="200"
      :src="src"
      :preview="{ open, onOpenChange: (next: boolean) => (open = next) }"
    />
  </div>
</template>
`;export{n as default};
