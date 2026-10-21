<script setup lang="ts">
// 多个按钮组合：用 role="group" 提供可访问的操作组语义
import { Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const lastAction = ref('尚未操作');

function run(action: string): void {
  lastAction.value = action;
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <div role="group" aria-label="文档操作">
      <Space wrap>
        <Button type="primary" @click="run('编辑')">编辑</Button>
        <Button @click="run('复制')">复制</Button>
        <Button @click="run('分享')">分享</Button>
        <Button danger @click="run('删除')">删除</Button>
      </Space>
    </div>
    <p aria-live="polite" style="margin: 0; color: #999; font-size: 12px">
      最近操作：{{ lastAction }}
    </p>
  </div>
</template>
