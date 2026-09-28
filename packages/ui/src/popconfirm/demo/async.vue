<script setup lang="ts">
// 对齐 antd 的 async demo：受控 open + 异步确认

import { Button, Popconfirm } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const confirmLoading = ref(false);

const showPopconfirm = () => {
  open.value = true;
};

const handleOk = () => {
  confirmLoading.value = true;
  setTimeout(() => {
    open.value = false;
    confirmLoading.value = false;
  }, 2000);
};

const handleCancel = () => {
  open.value = false;
};
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
