<script setup lang="ts">
// 对齐 antd demo/loading.tsx
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);

const showLoading = () => {
  open.value = true;
  setTimeout(() => {
    open.value = false;
  }, 3000);
};
</script>

<template>
  <Button type="primary" @click="showLoading">Open Modal</Button>
  <Modal title="Loading Modal" :open="open" :footer="null" loading>
    <p>Some contents...</p>
  </Modal>
</template>
