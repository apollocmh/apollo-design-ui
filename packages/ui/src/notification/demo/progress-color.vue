<script setup lang="ts">
import { Button, ConfigProvider, notification } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();
const theme = {
  components: {
    Notification: {
      progressBg:
        'linear-gradient(90deg, var(--apollo-color-success-border), var(--apollo-color-success))',
    },
  },
};
const openNotification = () => {
  api.open({
    title: 'Customize progress bar color',
    description: 'The progress bar uses Notification.progressBg from the nearest ConfigProvider.',
    showProgress: true,
    duration: 20,
  });
};
</script>

<template>
  <ConfigProvider :theme="theme">
    <component :is="contextHolder" />
    <Button type="primary" @click="openNotification">Show custom progress color</Button>
  </ConfigProvider>
</template>
