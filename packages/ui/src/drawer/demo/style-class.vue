<script setup lang="ts">
// 对齐 antd demo/style-class.tsx
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
  <Drawer title="语义化样式" :open="open" @close="onClose">
    <p>Some contents...</p>
  </Drawer>
</template>
