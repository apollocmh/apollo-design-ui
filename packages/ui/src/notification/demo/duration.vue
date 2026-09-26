<script setup lang="ts">
// 对齐 antd demo/duration.tsx —— duration: 0 ⇒ 不自动关闭（默认 4.5s）
import { Button, notification } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();

const openNotification = () => {
  api.open({
    title: 'Notification Title',
    description:
      'I will never close automatically. This is a purposely very very long description that has many many characters and words.',
    duration: 0,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="openNotification">Open the notification box</Button>
</template>
