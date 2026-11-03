<script setup lang="ts">
// 对齐 antd demo/hooks.tsx —— hooks 形态能消费 context（这里用 provide/inject 演示）

import type { NotificationPlacement } from '@apollo-design/ui';
import { Button, Divider, notification, Space } from '@apollo-design/ui';
import { defineComponent, h, inject, provide } from 'vue';

const nameKey = Symbol('demo-name');
provide(nameKey, 'Apollo Design');
const Greeting = defineComponent({
  setup() {
    const name = inject(nameKey, 'Default');
    return () => h('span', `Hello, ${name}!`);
  },
});

const [api, contextHolder] = notification.useNotification();

const openNotification = (placement: NotificationPlacement) => {
  api.info({
    title: `Notification ${placement}`,
    // Holder 中实际挂载的后代组件读取当前示例的 provide。
    description: h(Greeting),
    placement,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Space wrap>
    <Button type="primary" @click="openNotification('topLeft')">topLeft</Button>
    <Button type="primary" @click="openNotification('topRight')">topRight</Button>
  </Space>
  <Divider />
  <Space wrap>
    <Button type="primary" @click="openNotification('bottomLeft')">bottomLeft</Button>
    <Button type="primary" @click="openNotification('bottomRight')">bottomRight</Button>
  </Space>
</template>
