<script setup lang="ts">
// 两个中文字 + loading：自动插入空格的检测与加载态共存
import { Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const loading = ref(false);
const status = ref('未提交');

function submit(): void {
  if (loading.value) return;
  loading.value = true;
  status.value = '提交中…';
  window.setTimeout(() => {
    loading.value = false;
    status.value = '提交完成';
  }, 1500);
}
</script>

<template>
  <Space orientation="vertical" :size="12" style="font-family: sans-serif">
    <Space wrap>
      <Button type="primary" loading>确定</Button>
      <Button loading>取消</Button>
      <Button type="primary" :loading="loading" @click="submit">提交</Button>
    </Space>
    <div style="font-size: 12px; color: #999">
      状态：{{ status }}（loading 图标与两个中文字之间仍保持自动间距）
    </div>
  </Space>
</template>
