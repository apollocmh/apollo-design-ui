<script setup lang="ts">
// 对齐 antd demo/control.tsx（受控 + 点击关闭）

import { Button, Popover } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const hide = () => {
  open.value = false;
};
</script>

<template>
  <Popover
    v-model:open="open"
    title="Title"
    trigger="click"
  >
    <template #content>
      <a @click="hide">Close</a>
    </template>
    <Button type="primary">Click me</Button>
  </Popover>
</template>
