<script setup lang="ts">
// 对齐 antd demo/overlay-open.tsx（受控 open）
import { Button, Dropdown } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(true);

const items = [
  { key: '1', label: '1st menu item' },
  { key: '2', label: '2nd menu item' },
];

const toggle = () => {
  open.value = !open.value;
};
</script>

<template>
  <Dropdown :menu="{ items }" :open="open" @open-change="(v: boolean) => (open = v)">
    <Button @click="toggle">
      Toggle open
    </Button>
  </Dropdown>
</template>
