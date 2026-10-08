<script setup lang="ts">
// 对齐 antd 的 basic demo

import { CloseCircleOutlined } from '@apollo-design/icons';
import { Space, Tag } from '@apollo-design/ui';
import { h } from 'vue';

const preventDefault = (e: MouseEvent) => {
  e.preventDefault();
  console.log('Clicked! But prevent default.');
};
</script>

<template>
  <Space wrap>
    <Tag>Tag 1</Tag>
    <Tag>
      <a href="https://github.com" target="_blank" rel="noopener noreferrer">Link</a>
    </Tag>
    <Tag :close-icon="h(CloseCircleOutlined)" @close="preventDefault">Prevent Default</Tag>
    <Tag closable>Tag 2</Tag>
  </Space>
</template>
