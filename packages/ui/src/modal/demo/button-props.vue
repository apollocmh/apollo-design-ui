<script setup lang="ts">
// 对齐 antd demo/button-props.tsx
import { Button, Modal } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <Button type="primary" @click="open = true">Open Modal with customized button props</Button>
  <Modal
    title="Basic Modal"
    :open="open"
    :ok-button-props="{ disabled: true }"
    :cancel-button-props="{ disabled: true }"
    @ok="open = false"
    @cancel="open = false"
  >
    <p>Some contents...</p>
    <p>Some contents...</p>
    <p>Some contents...</p>
  </Modal>
</template>
