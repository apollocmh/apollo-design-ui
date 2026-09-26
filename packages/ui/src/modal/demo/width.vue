<script setup lang="ts">
// 对齐 antd demo/width.tsx
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Button type="primary" @click="open = true">Open Modal</Button>
  <Modal
    title="Custom Width"
    :width="1000"
    :open="open"
    @ok="open = false"
    @cancel="open = false"
  >
    <p>Some contents...</p>
    <p>Some contents...</p>
    <p>Some contents...</p>
  </Modal>
</template>
