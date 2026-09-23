<script setup lang="ts">
// 对齐 antd 的 disabled demo
import { Button, Radio } from '@apollo-design/ui';
import { ref } from 'vue';

const disabled = ref(true);
</script>

<template>
  <Radio :default-checked="false" :disabled="disabled">Disabled</Radio>
  <Radio default-checked :disabled="disabled">Disabled</Radio>
  <br />
  <!-- ⚠️ 内联 style 的数字必须写 px 字符串（Vue 的 patchStyle 不做数字→px 转换） -->
  <Button type="primary" :style="{ marginTop: '16px' }" @click="disabled = !disabled">
    Toggle disabled
  </Button>
</template>
