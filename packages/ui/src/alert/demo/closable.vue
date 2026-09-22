<script setup lang="ts">
// 对齐 antd 的 closable demo
import { Alert } from '@apollo-design/ui';

const onClose = (e: MouseEvent) => {
  console.log(e, 'I was closed.');
};
</script>

<template>
  <div>
    <Alert
      title="Warning Title"
      type="warning"
      :closable="{ closeIcon: true, onClose, 'aria-label': 'close' }"
    />
    <br />
    <Alert
      title="Success Title"
      type="success"
      :closable="{ closeIcon: true, onClose, 'aria-label': 'close' }"
    />
    <br />
    <Alert
      title="Info Title"
      type="info"
      :closable="{ closeIcon: true, onClose, 'aria-label': 'close' }"
    />
    <br />
    <Alert
      title="Error Title"
      type="error"
      :closable="{ closeIcon: true, onClose, 'aria-label': 'close' }"
    />
  </div>
</template>
