<script setup lang="ts">
// 对齐 antd demo/basic.tsx
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const isModalOpen = ref(false);

const showModal = () => {
  isModalOpen.value = true;
};
const handleOk = () => {
  isModalOpen.value = false;
};
const handleCancel = () => {
  isModalOpen.value = false;
};
</script>

<template>
  <Button type="primary" @click="showModal">Open Modal</Button>
  <Modal
    title="Basic Modal"
    :closable="{ 'aria-label': 'Custom Close Button' }"
    :open="isModalOpen"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <p>Some contents...</p>
    <p>Some contents...</p>
    <p>Some contents...</p>
  </Modal>
</template>
