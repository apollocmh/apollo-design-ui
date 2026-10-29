<script setup lang="ts">
// 紧凑组合：Space.Compact 拼接 Input / InputNumber / Button
import { Button, Input, InputNumber, SpaceCompact } from '@apollo-design/ui';
import { ref } from 'vue';

const email = ref('');
const quantity = ref<number | null>(1);
const result = ref('尚未提交');

function submit(): void {
  result.value = `${email.value || '(空)'} / ${quantity.value ?? '(空)'}`;
}
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; width: 460px">
    <div role="group" aria-label="订阅表单">
      <SpaceCompact>
        <Input
          v-model:value="email"
          aria-label="订阅邮箱"
          placeholder="name@example.com"
          style="width: 240px"
        />
        <InputNumber
          v-model:value="quantity"
          aria-label="订阅份数"
          :min="1"
          :max="10"
          style="width: 110px"
        />
        <Button type="primary" @click="submit">订阅</Button>
      </SpaceCompact>
    </div>

    <div role="group" aria-label="关键词搜索">
      <SpaceCompact>
        <Input aria-label="搜索关键词" placeholder="搜索组件" style="width: 320px" />
        <Button>搜索</Button>
      </SpaceCompact>
    </div>

    <p aria-live="polite" style="margin: 0; color: var(--apollo-color-text-secondary); font-size: 12px">
      提交结果：{{ result }}
    </p>
  </div>
</template>
