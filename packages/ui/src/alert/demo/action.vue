<script setup lang="ts">
// 对齐 antd 的 action demo
import { Alert, Button } from '@apollo-design/ui';
</script>

<template>
  <div>
    <Alert
      title="Success Tips"
      type="success"
      show-icon
      closable
    >
      <template #action>
        <Button size="small" type="text">UNDO</Button>
      </template>
    </Alert>
    <br />
    <Alert
      title="Error Text"
      show-icon
      description="Error Description Error Description Error Description Error Description"
      type="error"
    >
      <template #action>
        <Button size="small" danger>Detail</Button>
      </template>
    </Alert>
    <br />
    <Alert title="Warning Text" type="warning" closable>
      <template #action>
        <Button type="text" size="small">Done</Button>
      </template>
    </Alert>
    <br />
    <Alert
      title="Info Text"
      description="Info Description Info Description Info Description Info Description"
      type="info"
      closable
    >
      <template #action>
        <div class="demo-alert-action-col">
          <Button size="small" type="primary" block>Accept</Button>
          <Button size="small" danger ghost block>Decline</Button>
        </div>
      </template>
    </Alert>
  </div>
</template>

<style scoped>
.demo-alert-action-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 80px;
}
</style>
