<script setup lang="ts">
// 对齐 antd demo/config.tsx —— AppConfig 沿树合并（message/notification 配置）。
import { App, Button, Space } from '@apollo-design/ui';
import { h, ref } from 'vue';

const limited = ref(true);

const Page = {
  setup() {
    const { message, notification } = App.useApp();
    return () =>
      h(Space, { wrap: true }, () => [
        h(
          Button,
          { type: 'primary', onClick: () => message.success('Success!') },
          () => 'Message for only one',
        ),
        h(
          Button,
          {
            type: 'primary',
            onClick: () => notification.info({ title: 'Notification' }),
          },
          () => 'Notification for bottomLeft',
        ),
      ]);
  },
};
</script>

<template>
  <App
    :message="{ maxCount: limited ? 1 : 2 }"
    :notification="{ placement: limited ? 'bottomLeft' : 'topLeft' }"
  >
    <Button @click="limited = !limited">Change current defaults</Button>
    <Page />
  </App>
</template>
