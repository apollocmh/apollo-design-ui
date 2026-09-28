<script setup lang="ts">
// 对齐 antd 的 icon demo
import { QuestionCircleOutlined } from '@apollo-design/icons';
import { Button, Popconfirm } from '@apollo-design/ui';
import { h } from 'vue';

const icon = h(QuestionCircleOutlined, { style: { color: 'red' } });
</script>

<template>
  <Popconfirm
    title="Delete the task"
    description="Are you sure to delete this task?"
    :icon="icon"
  >
    <Button danger>Delete</Button>
  </Popconfirm>
</template>
