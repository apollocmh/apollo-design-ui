const n=`<script setup lang="ts">
// 对齐 antd demo/render-in-current.tsx —— getContainer=false 内联渲染（不 portal）
import { Button, Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const showDrawer = () => {
  open.value = true;
};
const onClose = () => {
  open.value = false;
};
<\/script>

<template>
  <div style="position: relative; height: 240px; overflow: hidden; border: 1px solid #ddd">
    <Button type="primary" @click="showDrawer">Open</Button>
    <Drawer
      title="Render in current node"
      :get-container="(false as never)"
      :open="open"
      :style="{ position: 'absolute' }"
      @close="onClose"
    >
      <p>Render in current node (no portal).</p>
    </Drawer>
  </div>
</template>
`;export{n as default};
