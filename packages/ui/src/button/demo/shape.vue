<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button, Space } from '@apollo-design/ui';
</script>

<template>
  <Space wrap>
    <Button type="primary" shape="circle" :icon="SearchOutlined" aria-label="Search" />
    <Button type="primary" shape="round">Round</Button>
    <Button type="primary" shape="square">Square</Button>
    <Button shape="circle" :icon="SearchOutlined" aria-label="Search" />
    <Button shape="round">Round</Button>
  </Space>
</template>
