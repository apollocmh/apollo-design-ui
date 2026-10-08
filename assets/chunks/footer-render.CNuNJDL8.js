const e=`<script setup lang="ts">
// 对齐 antd demo/footer-render.tsx：自定义 footer（Vue 用 #footer slot）
import { Button, Modal, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
<\/script>

<template>
  <Button type="primary" @click="open = true">Open Modal with customized footer</Button>
  <Modal
    title="Custom Footer Render"
    :open="open"
    @ok="open = false"
    @cancel="open = false"
  >
    <p>Some contents...</p>
    <template #footer>
      <Space>
        <Button @click="open = false">Cancel</Button>
        <Button danger type="primary" @click="open = false">Custom</Button>
        <Button type="primary" @click="open = false">OK</Button>
      </Space>
    </template>
  </Modal>
</template>
`;export{e as default};
