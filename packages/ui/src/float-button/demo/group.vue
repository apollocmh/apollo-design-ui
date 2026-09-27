<script setup lang="ts">
// 对齐 antd demo/group.tsx
import { QuestionCircleOutlined, SyncOutlined } from '@apollo-design/icons';
import { FloatButton, FloatButtonBackTop, FloatButtonGroup } from '@apollo-design/ui';
</script>

<template>
  <div>
    <FloatButtonGroup shape="circle" style="inset-inline-end: 24px">
      <FloatButton #icon><QuestionCircleOutlined /></FloatButton>
      <FloatButton />
      <FloatButtonBackTop :visibility-height="0" />
    </FloatButtonGroup>
    <FloatButtonGroup shape="square" style="inset-inline-end: 94px">
      <FloatButton #icon><QuestionCircleOutlined /></FloatButton>
      <FloatButton />
      <FloatButton #icon><SyncOutlined /></FloatButton>
      <FloatButtonBackTop :visibility-height="0" />
    </FloatButtonGroup>
  </div>
</template>
