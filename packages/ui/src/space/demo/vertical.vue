<script setup lang="ts">
import { Card, Space } from '@apollo-design/ui';
</script>
<template>
  <Space orientation="vertical" size="medium" style="display: flex">
    <Card v-for="i in 3" :key="i" title="Card" size="small"><p>Card content</p><p>Card content</p></Card>
  </Space>
</template>
