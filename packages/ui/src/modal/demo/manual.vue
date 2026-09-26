<script setup lang="ts">
// 对齐 antd demo/manual.tsx
import { Button, Modal } from '@apollo-design/ui';

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
</script>

<template>
  <Button @click="countDown">Open modal to close in 5s</Button>
  <component :is="contextHolder" />
</template>
