<script setup lang="ts">
// 对齐 antd 的 status demo
import { Badge, Space } from '@apollo-design/ui';
</script>

<template>
  <Space wrap>
    <Badge status="success" text="Success" />
    <Badge status="error" text="Error" />
    <Badge status="default" text="Default" />
    <Badge status="processing" text="Processing" />
    <Badge status="warning" text="Warning" />
    <Badge status="success"><span style="display: inline-block; width: 40px; height: 40px; background: var(--apollo-color-fill-alter)">A</span></Badge>
    <Badge status="processing"><input aria-label="Wrapped status draft" placeholder="Draft" style="width: 100px" /></Badge>
  </Space>
</template>
