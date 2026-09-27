<script setup lang="ts">
// 对齐 antd demo/shape.tsx
import { CustomerServiceOutlined } from '@apollo-design/icons';
import { FloatButton } from '@apollo-design/ui';
</script>

<template>
  <div>
    <FloatButton #icon shape="circle" type="primary" style="inset-inline-end: 94px">
      <CustomerServiceOutlined />
    </FloatButton>
    <FloatButton #icon shape="square" type="primary" style="inset-inline-end: 24px">
      <CustomerServiceOutlined />
    </FloatButton>
  </div>
</template>
