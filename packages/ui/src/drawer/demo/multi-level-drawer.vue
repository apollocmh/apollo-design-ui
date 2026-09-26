<script setup lang="ts">
// 对齐 antd demo/multi-level-drawer.tsx —— 嵌套抽屉（父级被推挤）
import { Button, Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const childrenDrawer = ref(false);
const showDrawer = () => {
  open.value = true;
};
const onClose = () => {
  open.value = false;
};
const showChildrenDrawer = () => {
  childrenDrawer.value = true;
};
const onChildrenDrawerClose = () => {
  childrenDrawer.value = false;
};
</script>

<template>
  <Button type="primary" @click="showDrawer">Open drawer</Button>
  <Drawer title="Multi-level drawer" :open="open" @close="onClose">
    <Button type="primary" @click="showChildrenDrawer">Two-level drawer</Button>
    <Drawer title="Two-level Drawer" :open="childrenDrawer" @close="onChildrenDrawerClose">
      <p>This is two-level drawer</p>
    </Drawer>
  </Drawer>
</template>
