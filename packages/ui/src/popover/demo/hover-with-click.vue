<script setup lang="ts">
// 对齐 antd demo/hover-with-click.tsx（hover 与 click 双触发嵌套）

import { Button, Popover } from '@apollo-design/ui';
import { ref } from 'vue';

const clicked = ref(false);
const hovered = ref(false);

const hide = () => {
  clicked.value = false;
  hovered.value = false;
};
const handleHoverChange = (next: boolean) => {
  hovered.value = next;
  clicked.value = false;
};
const handleClickChange = (next: boolean) => {
  hovered.value = false;
  clicked.value = next;
};
</script>

<template>
  <Popover
    style="width: 500px"
    title="Hover title"
    trigger="hover"
    :open="hovered"
    @open-change="handleHoverChange"
  >
    <template #content>
      <div>This is hover content.</div>
    </template>
    <Popover
      title="Click title"
      trigger="click"
      :open="clicked"
      @open-change="handleClickChange"
    >
      <template #content>
        <div>This is click content.</div>
        <a @click="hide">Close</a>
      </template>
      <Button>Hover and click</Button>
    </Popover>
  </Popover>
</template>
