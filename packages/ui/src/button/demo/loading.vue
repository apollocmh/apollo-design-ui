<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
import { onUnmounted, ref } from 'vue';

const loading = ref(false);
const delayLoading = ref(false);
const count = ref(0);
let immediateTimer: ReturnType<typeof setTimeout> | undefined;
let delayedTimer: ReturnType<typeof setTimeout> | undefined;
function enter(delayed: boolean) {
  const current = delayed ? delayLoading : loading;
  if (current.value) return;
  current.value = true;
  count.value++;
  const finish = () => {
    current.value = false;
  };
  if (delayed) delayedTimer = setTimeout(finish, 3000);
  else immediateTimer = setTimeout(finish, 3000);
}
onUnmounted(() => {
  clearTimeout(immediateTimer);
  clearTimeout(delayedTimer);
});
</script>
<template>
  <Space orientation="vertical">
    <Space wrap>
      <Button type="primary" loading>Loading</Button>
      <Button type="primary" :loading="delayLoading ? { delay: 1000 } : false" @click="enter(true)">
        Delay 1s
      </Button>
      <Button type="primary" :loading="loading" @click="enter(false)">Click me</Button>
    </Space>
    <p aria-live="polite" style="margin:0;color:var(--apollo-color-text-secondary)">
      已触发 {{ count }} 次；加载请求立即阻止重复点击，1 秒只延迟指示器显示，3 秒后恢复。
    </p>
  </Space>
</template>
