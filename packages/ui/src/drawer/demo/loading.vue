<script setup lang="ts">
// 对齐 antd demo/loading.tsx
import { Button, Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const loading = ref(true);
const showDrawer = () => {
  loading.value = true;
  open.value = true;
};
const onClose = () => {
  open.value = false;
};
</script>

<template>
  <Button type="primary" @click="showDrawer">Open</Button>
  <Drawer title="抽屉内容加载中" :open="open" :loading="loading" @close="onClose">
    <template #extra>
      <Button size="small" :aria-pressed="loading" @click="loading = !loading">Loading</Button>
    </template>
    <p>Some contents...</p>
  </Drawer>
</template>
