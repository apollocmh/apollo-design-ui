const t=`<script setup lang="ts">
// 对齐 antd demo/placement.tsx
import { CommentOutlined } from '@apollo-design/icons';
import { FloatButton, FloatButtonGroup } from '@apollo-design/ui';
<\/script>

<template>
  <FloatButtonGroup trigger="click" placement="top" style="inset-inline-end: 24px">
    <template #icon><CommentOutlined /></template>
    <FloatButton />
  </FloatButtonGroup>
</template>
`;export{t as default};
