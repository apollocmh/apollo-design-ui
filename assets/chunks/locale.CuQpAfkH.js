const n=`<script setup lang="ts">
// 对齐 antd demo/locale.tsx
import { ExclamationCircleOutlined } from '@apollo-design/icons';
import { Button, Modal, Space } from '@apollo-design/ui';
import { h, ref } from 'vue';

const [modal, contextHolder] = Modal.useModal();
const open = ref(false);

const confirm = () => {
  modal.confirm({
    title: 'Confirm',
    icon: h(ExclamationCircleOutlined),
    content: 'Bla bla ...',
    okText: '确认',
    cancelText: '取消',
  });
};
<\/script>

<template>
  <Space>
    <Button type="primary" @click="open = true">Modal</Button>
    <Button @click="confirm">Confirm</Button>
  </Space>
  <Modal
    title="Modal"
    :open="open"
    ok-text="确认"
    cancel-text="取消"
    @ok="open = false"
    @cancel="open = false"
  >
    <p>Bla bla ...</p>
    <p>Bla bla ...</p>
    <p>Bla bla ...</p>
  </Modal>
  <component :is="contextHolder" />
</template>
`;export{n as default};
