<script setup lang="ts">
// 对齐 antd 的 disabled demo
import { Button, Space, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const disabled = ref(true);
</script>

<template>
  <Space orientation="vertical">
    <Switch :disabled="disabled" default-checked aria-label="Disabled switch" />
    <Button type="primary" @click="disabled = !disabled">Toggle disabled</Button>
  </Space>
</template>
