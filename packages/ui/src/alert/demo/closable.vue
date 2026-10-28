<script setup lang="ts">
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
      :closable="{ closeIcon: true, 'aria-label': 'close' }"
      @close="onClose"
    />
    <br />
    <Alert
      title="Success Title"
      type="success"
      :closable="{ closeIcon: true, 'aria-label': 'close' }"
      @close="onClose"
    />
    <br />
    <Alert
      title="Info Title"
      type="info"
      :closable="{ closeIcon: true, 'aria-label': 'close' }"
      @close="onClose"
    />
    <br />
    <Alert
      title="Error Title"
      type="error"
      :closable="{ closeIcon: true, 'aria-label': 'close' }"
      @close="onClose"
    />
  </div>
</template>
