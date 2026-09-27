<script setup lang="ts">
// 对齐 antd demo/content.tsx（C8-R2：content → #content 插槽）
import { FileTextOutlined } from '@apollo-design/icons';
</script>

<template>
  <div>
    <FloatButton #icon shape="square" style="inset-inline-end: 164px">
      <template #content>HELP</template>
      <template #icon><FileTextOutlined /></template>
    </FloatButton>
    <FloatButton #icon shape="square" style="inset-inline-end: 94px">
      <template #content>HELP INFO</template>
      <template #icon><FileTextOutlined /></template>
    </FloatButton>
    <FloatButton shape="square" style="inset-inline-end: 24px">
      <template #content>HELP INFO</template>
    </FloatButton>
  </div>
</template>
