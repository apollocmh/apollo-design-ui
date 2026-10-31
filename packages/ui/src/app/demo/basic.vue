<script setup lang="ts">
// Services belong to the nearest App and are released when it unmounts.
import { App, Button, Space } from '@apollo-design/ui';
import { h } from 'vue';

const Page = {
  setup() {
    const { message, modal, notification } = App.useApp();
    return () =>
      h(Space, { wrap: true }, () => [
        h(
          Button,
          { type: 'primary', onClick: () => message.success('Success!') },
          () => 'Open message',
        ),
        h(
          Button,
          {
            type: 'primary',
            onClick: () => modal.warning({ title: 'This is a warning message' }),
          },
          () => 'Open modal',
        ),
        h(
          Button,
          {
            type: 'primary',
            onClick: () =>
              notification.info({ title: 'Notification topLeft', placement: 'topLeft' }),
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
