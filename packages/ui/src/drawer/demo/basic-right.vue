<script setup lang="ts">
// 对齐 antd demo/basic-right.tsx
import { Button, Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const showDrawer = () => {
  open.value = true;
};
const onClose = () => {
  open.value = false;
};
</script>

<template>
  <Button type="primary" @click="showDrawer">Open</Button>
  <Drawer title="Basic Drawer" :open="open" @close="onClose">
    <p>Some contents...</p>
    <p>Some contents...</p>
    <p>Some contents...</p>
  </Drawer>
</template>
