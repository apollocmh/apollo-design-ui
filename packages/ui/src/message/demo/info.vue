<script setup lang="ts">
// 对齐 antd demo/info.tsx —— 静态方法（无法消费 context，推荐用 hooks 形态）
import { Button, message } from '@apollo-design/ui';
import { onBeforeUnmount, useId } from 'vue';

const key = useId();
onBeforeUnmount(() => message.destroy(key));

const info = () => {
  message.info({ key, content: 'This is a normal message' });
};
</script>

<template>
  <Button type="primary" @click="info">Static Method</Button>
</template>
