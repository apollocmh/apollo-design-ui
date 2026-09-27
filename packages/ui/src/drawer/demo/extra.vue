<script setup lang="ts">
// 对齐 antd demo/extra.tsx —— extra 区（本仓用 `#extra` slot，值是 vnode）

import type { DrawerPlacement } from '@apollo-design/ui';
import { Button, Drawer, Radio, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const placement = ref<DrawerPlacement>('right');
const showDrawer = () => {
  open.value = true;
};
const onClose = () => {
  open.value = false;
};
</script>

<template>
  <Space>
    <Radio.Group v-model:value="placement">
      <Radio value="top">top</Radio>
      <Radio value="right">right</Radio>
      <Radio value="bottom">bottom</Radio>
      <Radio value="left">left</Radio>
    </Radio.Group>
    <Button type="primary" @click="showDrawer">Open</Button>
  </Space>
  <Drawer title="Drawer Title" :placement="placement" :open="open" @close="onClose">
    <p>Some contents...</p>
    <template #extra>
      <Space>
        <Button>Cancel</Button>
        <Button type="primary">Submit</Button>
      </Space>
    </template>
  </Drawer>
</template>
