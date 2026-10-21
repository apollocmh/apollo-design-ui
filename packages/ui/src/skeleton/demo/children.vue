<script setup lang="ts">
// 对齐 antd 的 children demo：loading 切换骨架与默认插槽
import { Button, Skeleton } from '@apollo-design/ui';
import { ref } from 'vue';

const loading = ref(false);

const reload = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 800);
};
</script>

<template>
  <Button :disabled="loading" @click="reload">{{ loading ? '加载中…' : '重新加载' }}</Button>
  <Skeleton :loading="loading" avatar :paragraph="{ rows: 3 }" style="margin-top: 16px">
    <div>
      <strong>张三</strong>
      <p>这是加载完成后显示的真实内容；`loading` 为 false 时只渲染默认插槽。</p>
    </div>
  </Skeleton>
</template>
