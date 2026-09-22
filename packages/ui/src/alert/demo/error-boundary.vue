<script setup lang="ts">
// 对齐 antd 的 error-boundary demo
import { AlertErrorBoundary, Button } from '@apollo-design/ui';
import { ref } from 'vue';

const error = ref<Error | undefined>(undefined);

const throwError = () => {
  error.value = new Error('An Uncaught Error');
  // 直接抛出 —— ErrorBoundary 的 onErrorCaptured 会捕获并切换到错误 Alert
  throw error.value;
};
</script>

<template>
  <AlertErrorBoundary>
    <Button danger @click="throwError">Click to throw an error</Button>
  </AlertErrorBoundary>
</template>
