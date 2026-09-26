<script setup lang="ts">
// 对齐 antd demo/with-icon.tsx —— 四种类型（带图标）

import type { NotificationIconType } from '@apollo-design/ui';
import { Button, Flex, notification } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();

const openNotificationWithIcon = (type: NotificationIconType) => {
  api[type]({
    title: 'Notification Title',
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Flex gap="8px" wrap="wrap">
    <Button @click="openNotificationWithIcon('success')">Success</Button>
    <Button @click="openNotificationWithIcon('info')">Info</Button>
    <Button @click="openNotificationWithIcon('warning')">Warning</Button>
    <Button @click="openNotificationWithIcon('error')">Error</Button>
  </Flex>
</template>
