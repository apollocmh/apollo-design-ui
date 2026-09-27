<script setup lang="ts">
// 对齐 antd demo/type.tsx
import { QuestionCircleOutlined } from '@apollo-design/icons';
import { FloatButton } from '@apollo-design/ui';
</script>

<template>
  <div>
    <FloatButton #icon type="primary" style="inset-inline-end: 24px">
      <QuestionCircleOutlined />
    </FloatButton>
    <FloatButton #icon type="default" style="inset-inline-end: 94px">
      <QuestionCircleOutlined />
    </FloatButton>
  </div>
</template>
