<script setup lang="ts">
// 对齐 antd demo/custom-icon.tsx —— 自定义 icon
import { SmileOutlined } from '@apollo-design/icons';
import { Button, notification } from '@apollo-design/ui';
import { h } from 'vue';

const [api, contextHolder] = notification.useNotification();

const openNotification = () => {
  api.open({
    title: 'Notification Title',
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
    icon: h(SmileOutlined, { style: { color: '#108ee9' } }),
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Button type="primary" @click="openNotification">Open the notification box</Button>
</template>
