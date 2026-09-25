<script setup lang="ts">
// 对齐 antd demo/component-token.tsx —— ⚠️ 组件级 token 覆盖 PENDING
//（D25/D83 同判：ConfigProvider 主题覆盖未落地，这里以默认主题渲染）
import { Image } from '@apollo-design/ui';

const src =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
</script>

<template>
  <Image alt="demo image" :width="200" :src="src" />
</template>
