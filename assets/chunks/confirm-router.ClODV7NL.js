const n=`<script setup lang="ts">
// 对齐 antd demo/confirm-router.tsx（上游用路由跳转；本 demo 用一段文案代替跳转目标）
import { ExclamationCircleOutlined } from '@apollo-design/icons';
import { Button, Modal } from '@apollo-design/ui';
import { h, ref } from 'vue';

const current = ref('home');

const navigate = () => {
  Modal.confirm({
    title: 'Do you want to leave this page?',
    icon: h(ExclamationCircleOutlined),
    content: 'All unsaved changes will be lost.',
    onOk() {
      current.value = 'about';
    },
    onCancel() {
      current.value = 'home';
    },
  });
};
<\/script>

<template>
  <p>Current page: {{ current }}</p>
  <Button @click="navigate">Leave this page</Button>
</template>
`;export{n as default};
