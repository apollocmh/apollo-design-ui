<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button } from '../../index';
</script>

<template>
  <Button type="primary" :icon="SearchOutlined">Search</Button>
  <Button :icon="SearchOutlined" icon-placement="end">Search</Button>
  <Button type="primary" :icon="SearchOutlined" />
  <!-- 用插槽传图标 -->
  <Button type="primary">
    <template #icon><SearchOutlined /></template>
    Slot icon
  </Button>
</template>
