<script setup lang="ts">
// 对齐 antd 的 promise demo：onConfirm 返回 Promise，resolve 后才关闭
import { Button, Popconfirm } from '@apollo-design/ui';
import { onBeforeUnmount } from 'vue';

const timers = new Set<ReturnType<typeof setTimeout>>();
const confirm = () =>
  new Promise((resolve) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      resolve(null);
    }, 3000);
    timers.add(timer);
  });
onBeforeUnmount(() => {
  for (const timer of timers) clearTimeout(timer);
});
</script>

<template>
  <Popconfirm
    title="Title"
    description="Open Popconfirm with Promise"
    :on-confirm="confirm"
    @open-change="() => console.log('open change')"
  >
    <Button type="primary">Open Popconfirm with Promise</Button>
  </Popconfirm>
</template>
