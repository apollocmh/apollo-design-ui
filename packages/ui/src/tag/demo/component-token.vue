<script setup lang="ts">
// 对齐 antd 的 component-token demo：覆盖 Tag 的默认底色、文字色与 solid 文字色。
import { Tag } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-tag-token">
    <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px">
      <Tag>Default</Tag>
      <Tag>Another</Tag>
      <Tag color="blue">Blue</Tag>
      <Tag color="green" variant="solid">Solid</Tag>
      <Tag variant="outlined">Outlined</Tag>
    </div>
  </div>
</template>

<style>
.demo-tag-token .apollo-tag {
  --apollo-tag-default-bg: #fff7e6;
  --apollo-tag-default-color: #d46b08;
  --apollo-tag-solid-text-color: #fffbe6;
}
</style>
