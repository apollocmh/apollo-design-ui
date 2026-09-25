<script setup lang="ts">
// 对齐 antd demo/config.tsx —— AppConfig 沿树合并（message/notification 配置）。
import { App, Button, Space } from '@apollo-design/ui';
import { h } from 'vue';

const Page = {
  setup() {
    const { message, notification } = App.useApp();
    return () =>
      h(Space, { wrap: true }, () => [
        h(
          Button,
          { type: 'primary', onClick: () => message.success?.('Success!') },
          () => 'Message for only one',
        ),
        h(
          Button,
          {
            type: 'primary',
            onClick: () => notification.info?.({ title: 'Notification' }),
          },
          () => 'Notification for bottomLeft',
        ),
      ]);
  },
};
</script>

<template>
  <App :message="{ maxCount: 1 }" :notification="{ placement: 'bottomLeft' }">
    <Page />
  </App>
</template>
