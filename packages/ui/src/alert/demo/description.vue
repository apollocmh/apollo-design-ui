<script setup lang="ts">
// 对齐 antd 的 description demo
import { Alert } from '@apollo-design/ui';
</script>

<template>
  <div>
    <Alert
      title="Success Text"
      description="Success Description Success Description Success Description"
      type="success"
    />
    <br />
    <Alert
      title="Info Text"
      description="Info Description Info Description Info Description Info Description"
      type="info"
    />
    <br />
    <Alert
      title="Warning Text"
      description="Warning Description Warning Description Warning Description Warning Description"
      type="warning"
    />
    <br />
    <Alert
      title="Error Text"
      description="Error Description Error Description Error Description Error Description"
      type="error"
    />
  </div>
</template>
