<script setup lang="ts">
// 对齐 antd demo/hooks.tsx：useModal 拿到的实例可以按需更新与销毁

import { ExclamationCircleOutlined } from '@apollo-design/icons';
import { Button, Modal, Space } from '@apollo-design/ui';
import { h } from 'vue';

const [modal, contextHolder] = Modal.useModal();

const countDown = () => {
  let secondsToGo = 5;
  const instance = modal.success({
    title: 'This is a notification message',
    content: `This modal will be destroyed after ${secondsToGo} second.`,
  });
  const timer = setInterval(() => {
    secondsToGo -= 1;
    instance.update({
      content: `This modal will be destroyed after ${secondsToGo} second.`,
    });
  }, 1000);
  setTimeout(() => {
    clearInterval(timer);
    instance.destroy();
  }, secondsToGo * 1000);
};

const confirm = () => {
  modal.confirm({
    title: 'Confirm',
    icon: h(ExclamationCircleOutlined),
    content: 'Bla bla ...',
    okText: '确认',
    cancelText: '取消',
  });
};
</script>

<template>
  <Space>
    <Button @click="countDown">Open modal to close in 5s</Button>
    <Button @click="confirm">Confirm</Button>
  </Space>
  <component :is="contextHolder" />
</template>
