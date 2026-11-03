<script setup lang="ts">
// 对齐 antd demo/basic.tsx —— 静态方法（无法消费 context，推荐 hooks 形态）
import { Button, notification } from '@apollo-design/ui';
import { onBeforeUnmount, useId } from 'vue';

const key = useId();
onBeforeUnmount(() => notification.destroy(key));

const openNotification = () => {
  notification.open({
    key,
    title: 'Notification Title',
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
    onClick: () => {
      console.log('Notification Clicked!');
    },
  });
};
</script>

<template>
  <Button type="primary" @click="openNotification">Open the notification box</Button>
</template>
