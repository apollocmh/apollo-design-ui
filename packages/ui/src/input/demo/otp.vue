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
      <div style="margin-bottom: 8px; color: var(--apollo-color-text-secondary)">basic</div>
      <InputOTP v-model:value="value" aria-label="验证码" />
    </div>
    <div>
      <div style="margin-bottom: 8px; color: var(--apollo-color-text-secondary)">mask + separator</div>
      <InputOTP v-model:value="masked" mask aria-label="隐藏验证码">
        <template #separator="{ index }">{{ index === 2 ? '/' : '-' }}</template>
      </InputOTP>
    </div>
    <div style="font-size: 12px; color: var(--apollo-color-text-secondary)">values: {{ value || '-' }} / {{ masked || '-' }}</div>
  </div>
</template>
