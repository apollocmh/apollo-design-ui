<script setup lang="ts">
// 对齐 antd demo/basic.tsx —— useApp() 的三个 API（message/modal/notification
// 未落地 ⇒ v1 stub：调用即 dev 警告；组件落地后回填，README §4 PENDING-2）。
import { App, Button, Space } from '@apollo-design/ui';
import { h } from 'vue';

const Page = {
  setup() {
    const { message, modal, notification } = App.useApp();
    return () =>
      h(Space, { wrap: true }, () => [
        h(
          Button,
          { type: 'primary', onClick: () => message.success?.('Success!') },
          () => 'Open message',
        ),
        h(
          Button,
          {
            type: 'primary',
            onClick: () => modal.warning?.({ title: 'This is a warning message' }),
          },
          () => 'Open modal',
        ),
        h(
          Button,
          {
            type: 'primary',
            onClick: () =>
              notification.info?.({ title: 'Notification topLeft', placement: 'topLeft' }),
          },
          () => 'Open notification',
        ),
      ]);
  },
};
</script>

<template>
  <App>
    <Page />
  </App>
</template>
