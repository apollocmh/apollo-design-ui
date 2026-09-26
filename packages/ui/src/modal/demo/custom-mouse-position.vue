<script setup lang="ts">
// 对齐 antd demo/custom-mouse-position.tsx
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const isModalOpen = ref(false);
</script>

<template>
  <Button type="primary" @click="isModalOpen = true">Open Modal</Button>
  <Modal
    title="Basic Modal"
    :open="isModalOpen"
    :mouse-position="{ x: 300, y: 300 }"
    @ok="isModalOpen = false"
    @cancel="isModalOpen = false"
  >
    <p>Some contents...</p>
    <p>Some contents...</p>
    <p>Some contents...</p>
  </Modal>
</template>
