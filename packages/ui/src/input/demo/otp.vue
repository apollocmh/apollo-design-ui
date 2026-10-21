<script setup lang="ts">
// 对齐 antd 的 demo/otp.tsx
import { InputOTP } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const masked = ref('');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <div>
      <div style="margin-bottom: 8px; color: #666">basic</div>
      <InputOTP v-model:value="value" />
    </div>
    <div>
      <div style="margin-bottom: 8px; color: #666">mask + separator</div>
      <InputOTP v-model:value="masked" mask separator="-" />
    </div>
    <div style="font-size: 12px; color: #999">values: {{ value || '-' }} / {{ masked || '-' }}</div>
  </div>
</template>
