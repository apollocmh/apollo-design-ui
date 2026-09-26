<script setup lang="ts">
// 对齐 antd demo/wireframe.tsx
import { Button, ConfigProvider, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <ConfigProvider :theme="{ token: { wireframe: true } }">
    <Button type="primary" @click="open = true">Open Modal</Button>
    <Modal title="Wireframe Modal" :open="open" @ok="open = false" @cancel="open = false">
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Modal>
  </ConfigProvider>
</template>
