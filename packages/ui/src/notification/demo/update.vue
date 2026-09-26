<script setup lang="ts">
// 对齐 antd demo/update.tsx —— 同 key 复用同一条通知（更新内容）
import { Button, notification } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();
const key = 'updatable';

const openNotification = () => {
  api.open({ key, title: 'Notification Title', description: 'description.' });
  setTimeout(() => {
    api.open({ key, title: 'New Title', description: 'New description.' });
  }, 1000);
};
</script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="openNotification">Open the notification box</Button>
</template>
