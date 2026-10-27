<script setup lang="ts">
// autoInsertSpace：两个中文字之间是否自动视觉字距（默认 true）
import { Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const last = ref('');
</script>

<template>
  <Space orientation="vertical" :size="12" style="font-family: sans-serif">
    <Space wrap>
      <Button @click="last = '确定（默认视觉字距）'">确定</Button>
      <Button @click="last = '取消（默认视觉字距）'">取消</Button>
      <Button :auto-insert-space="false" @click="last = '确定（autoInsertSpace=false）'">确定</Button>
      <Button :auto-insert-space="false" @click="last = '取消（autoInsertSpace=false）'">取消</Button>
    </Space>
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">最近点击：{{ last || '-' }}</div>
  </Space>
</template>
