const e=`<script setup lang="ts">
// 对齐 antd demo/preview-group-visible.tsx —— 受控 open（v-model 等价）
import { Image } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const current = ref(0);
const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PreviewGroup = Image.PreviewGroup;
<\/script>

<template>
  <div style="display: flex; flex-direction: column; row-gap: 8px; align-items: flex-start">
    <button @click="open = !open">{{ open ? 'close' : 'open' }}</button>
    <PreviewGroup
      v-model:current="current"
      :preview="{ open, 'onUpdate:open': undefined }"
      :items="[src, src, src]"
    />
  </div>
</template>
`;export{e as default};
