<script setup lang="ts">
// 对齐 antd demo/with-btn.tsx —— actions 里放操作按钮 + onClose
import { Button, notification, Space } from '@apollo-design/ui';
import { h } from 'vue';

const [api, contextHolder] = notification.useNotification();

const close = () => {
  console.log(
    'Notification was closed. Either the close button was clicked or duration time elapsed.',
  );
};

const openNotification = () => {
  const key = 'open' + Date.now();
  // ⚠️ SFC 里用 `h()` 而不是 JSX（要写 JSX 得 `lang="tsx"`）
  const btn = h(Space, null, () => [
    h(Button, { type: 'link', size: 'small', onClick: () => api.destroy() }, () => 'Destroy All'),
    h(Button, { type: 'primary', size: 'small', onClick: () => api.destroy(key) }, () => 'Confirm'),
  ]);
  api.open({
    title: 'Notification Title',
    description:
      'A function will be called after the notification is closed (automatically after the "duration" time or manually).',
    actions: btn,
    key,
    onClose: close,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="openNotification">Open the notification box</Button>
</template>
