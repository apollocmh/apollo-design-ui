const n=`<script setup lang="ts">
// 对齐 antd demo/mask.tsx
import { Button, Modal, Space } from '@apollo-design/ui';

const modalConfig = {
  title: 'Title',
  content: 'Some contents...',
};

const [modal, contextHolder] = Modal.useModal();
<\/script>

<template>
  <Space>
    <Button @click="modal.confirm({ ...modalConfig, mask: { blur: true } })">blur</Button>
    <Button @click="modal.confirm(modalConfig)">Dimmed mask</Button>
    <Button @click="modal.confirm({ ...modalConfig, mask: false })">No mask</Button>
  </Space>
  <component :is="contextHolder" />
</template>
`;export{n as default};
