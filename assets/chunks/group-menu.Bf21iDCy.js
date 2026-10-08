const t=`<script setup lang="ts">
// 对齐 antd demo/group-menu.tsx
import { CommentOutlined, CustomerServiceOutlined } from '@apollo-design/icons';
import { FloatButton, FloatButtonGroup } from '@apollo-design/ui';
<\/script>

<template>
  <div>
    <FloatButtonGroup trigger="click" type="primary" style="inset-inline-end: 24px">
      <template #icon><CustomerServiceOutlined /></template>
      <FloatButton />
      <FloatButton #icon><CommentOutlined /></FloatButton>
    </FloatButtonGroup>
    <FloatButtonGroup trigger="hover" type="primary" style="inset-inline-end: 94px">
      <template #icon><CustomerServiceOutlined /></template>
      <FloatButton />
      <FloatButton #icon><CommentOutlined /></FloatButton>
    </FloatButtonGroup>
  </div>
</template>
`;export{t as default};
