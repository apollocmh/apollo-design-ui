<script setup lang="ts">
// 对齐 antd 的 async demo：受控 open + 异步确认

import { Button, Popconfirm } from '@apollo-design/ui';
import { onBeforeUnmount, ref } from 'vue';

const open = ref(false);
const confirmLoading = ref(false);

const showPopconfirm = () => {
  open.value = true;
};

let timer: ReturnType<typeof setTimeout> | undefined;
let finish: (() => void) | undefined;

const handleOk = (): Promise<void> => {
  confirmLoading.value = true;
  return new Promise((resolve) => {
    finish = resolve;
    timer = setTimeout(() => {
      timer = undefined;
      finish = undefined;
      open.value = false;
      confirmLoading.value = false;
      resolve();
    }, 2000);
  });
};

const handleCancel = () => {
  clearTimeout(timer);
  timer = undefined;
  open.value = false;
  confirmLoading.value = false;
  const resolve = finish;
  finish = undefined;
  resolve?.();
};

onBeforeUnmount(handleCancel);
</script>

<template>
  <Popconfirm
    v-model:open="open"
    title="Title"
    description="Open Popconfirm with async logic"
    :ok-button-props="{ loading: confirmLoading }"
    :on-confirm="handleOk"
    :on-cancel="handleCancel"
  >
    <Button type="primary" @click="showPopconfirm">Open Popconfirm with async logic</Button>
  </Popconfirm>
</template>
