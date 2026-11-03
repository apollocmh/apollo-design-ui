<script setup lang="ts">
import { ref } from 'vue';
import { Alert, Checkbox, Spin } from '../../index';

const loading = ref(false);
</script>

<template>
  <Spin :spinning="loading">
    <Alert type="info" title="Alert message title" description="Further details about the context of this alert." />
  </Spin>
  <p :style="{ marginTop: '16px' }">
    加载状态：
    <Checkbox v-model:checked="loading">切换</Checkbox>
  </p>
</template>
