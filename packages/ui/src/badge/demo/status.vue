<script setup lang="ts">
// 对齐 antd 的 status demo
import { Badge } from '@apollo-design/ui';
</script>

<template>
  <Badge status="success" text="Success" />
  <Badge status="error" text="Error" />
  <Badge status="default" text="Default" />
  <Badge status="processing" text="Processing" />
  <Badge status="warning" text="Warning" />
</template>
