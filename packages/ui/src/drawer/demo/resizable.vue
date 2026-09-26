<script setup lang="ts">
// 对齐 antd demo/resizable.tsx —— 拖拽改尺寸（v6 新增）
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
  <Drawer title="Resizable Drawer" resizable :open="open" @close="onClose">
    <p>Drag the handle on the edge to resize.</p>
  </Drawer>
</template>
