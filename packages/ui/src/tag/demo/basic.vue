<script setup lang="ts">
import { CloseCircleOutlined } from '@apollo-design/icons';
import { Space, Tag } from '@apollo-design/ui';

const preventDefault = (e: MouseEvent) => {
  e.preventDefault();
  console.log('Clicked! But prevent default.');
};
</script>

<template>
  <Space wrap>
    <Tag>Tag 1</Tag>
    <Tag href="https://github.com" target="_blank" rel="noopener noreferrer">Link</Tag>
    <Tag closable @close="preventDefault">
      Prevent Default
      <template #closeIcon><CloseCircleOutlined /></template>
    </Tag>
    <Tag closable>Tag 2</Tag>
  </Space>
</template>
