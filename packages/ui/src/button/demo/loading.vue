<script setup lang="ts">
import { ref } from 'vue';
import { Button, Space } from '../../index';

const loading = ref(false);
const delayLoading = ref(false);

function enter() {
  loading.value = true;
  delayLoading.value = true;
  setTimeout(() => {
    loading.value = false;
    delayLoading.value = false;
  }, 3000);
}
</script>

<template>
  <Space wrap>
    <Button type="primary" loading>Loading</Button>
    <Button type="primary" :loading="{ delay: 1000 }" @click="enter()">
      Delay 1s（1000ms 内点击不触发 click）
    </Button>
    <Button type="primary" :loading="loading" @click="enter()">Click me</Button>
  </Space>
</template>
