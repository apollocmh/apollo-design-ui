<script setup lang="ts">
// 调用者拥有加载状态；持久外层承接两种分支的布局间距。
import { Button, Skeleton } from '@apollo-design/ui';
import { onBeforeUnmount, ref } from 'vue';

const loading = ref(false);

let timer: ReturnType<typeof setTimeout> | undefined;
const reload = () => {
  if (timer !== undefined) clearTimeout(timer);
  loading.value = true;
  timer = setTimeout(() => {
    timer = undefined;
    loading.value = false;
  }, 800);
};
onBeforeUnmount(() => {
  if (timer !== undefined) clearTimeout(timer);
});
</script>

<template>
  <Button :disabled="loading" @click="reload">{{ loading ? '加载中…' : '重新加载' }}</Button>
  <div style="margin-top:16px">
    <Skeleton :loading="loading" avatar :paragraph="{ rows: 3 }">
      <div>
        <strong>张三</strong>
        <p>这是加载完成后显示的真实内容；`loading` 为 false 时只渲染默认插槽。</p>
      </div>
    </Skeleton>
  </div>
</template>
