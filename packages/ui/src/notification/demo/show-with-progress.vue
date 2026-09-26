<script setup lang="ts">
// 对齐 antd demo/show-with-progress.tsx —— showProgress + pauseOnHover
import { Button, notification, Space } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();

const openNotification = (pauseOnHover: boolean) => () => {
  api.open({
    title: 'Notification Title',
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
    showProgress: true,
    pauseOnHover,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Space>
    <Button type="primary" @click="openNotification(true)">Pause on hover</Button>
    <Button type="primary" @click="openNotification(false)">Don't pause on hover</Button>
  </Space>
</template>
