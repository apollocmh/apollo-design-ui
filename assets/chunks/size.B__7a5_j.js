const e=`<script setup lang="ts">
// 对齐 antd demo/size.tsx —— default / large 预设
import { Button, Drawer, Radio, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const size = ref<'default' | 'large'>('default');
const showDrawer = () => {
  open.value = true;
};
const onClose = () => {
  open.value = false;
};
<\/script>

<template>
  <Space>
    <Radio.Group v-model:value="size">
      <Radio value="default">Default</Radio>
      <Radio value="large">Large</Radio>
    </Radio.Group>
    <Button type="primary" @click="showDrawer">Open</Button>
  </Space>
  <Drawer title="Basic Drawer" :size="size" :open="open" @close="onClose">
    <p>Some contents...</p>
  </Drawer>
</template>
`;export{e as default};
