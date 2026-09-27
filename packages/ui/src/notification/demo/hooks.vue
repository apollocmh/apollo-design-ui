<script setup lang="ts">
// 对齐 antd demo/hooks.tsx —— hooks 形态能消费 context（这里用 provide/inject 演示）

import type { NotificationPlacement } from '@apollo-design/ui';
import { Button, Divider, notification, Space } from '@apollo-design/ui';
import { inject, provide } from 'vue';

const nameKey = Symbol('demo-name');
provide(nameKey, 'Apollo Design');
const name = inject(nameKey, 'Default');

const [api, contextHolder] = notification.useNotification();

const openNotification = (placement: NotificationPlacement) => {
  api.info({
    title: `Notification ${placement}`,
    // 内容在**调用时**求值（演示「能读到组件树的 context」）
    description: `Hello, ${name}!`,
    placement,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Space>
    <Button type="primary" @click="openNotification('topLeft')">topLeft</Button>
    <Button type="primary" @click="openNotification('topRight')">topRight</Button>
  </Space>
  <Divider />
  <Space>
    <Button type="primary" @click="openNotification('bottomLeft')">bottomLeft</Button>
    <Button type="primary" @click="openNotification('bottomRight')">bottomRight</Button>
  </Space>
</template>
