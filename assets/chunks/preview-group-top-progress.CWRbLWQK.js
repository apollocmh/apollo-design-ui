const e=`<script setup lang="ts">
// 对齐 antd demo/preview-group-top-progress.tsx —— 语义等价（自定义工具栏）
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PreviewGroup = Image.PreviewGroup;
<\/script>

<template>
  <PreviewGroup :items="[src, src]" :preview="{ actionsRender: undefined }" />
</template>
`;export{e as default};
