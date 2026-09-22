<script setup lang="ts">
// 对齐 antd 的 smooth-closed demo
import { Alert } from '@apollo-design/ui';
import { ref } from 'vue';

const visible = ref(true);

const handleClose = () => {
  visible.value = false;
};
</script>

<template>
  <div>
    <Alert
      v-if="visible"
      title="Alert Message Text"
      type="success"
      :closable="{ closeIcon: true, afterClose: handleClose }"
    />
    <p>click the close button to see the effect</p>
  </div>
</template>
