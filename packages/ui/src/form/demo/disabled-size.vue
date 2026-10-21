<script setup lang="ts">
// 对齐 antd 的 demo/disabled.tsx / size.tsx：Form 级联禁用与尺寸
import { Form, FormItem, Input, Radio, RadioGroup, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const disabled = ref(true);
const size = ref<'small' | 'middle' | 'large'>('middle');
</script>

<template>
  <div>
    <div style="display: flex; gap: 16px; margin-bottom: 16px; align-items: center">
      <span>disabled</span>
      <Switch v-model:checked="disabled" aria-label="禁用表单" />
      <RadioGroup v-model:value="size" size="small" aria-label="表单尺寸">
        <Radio value="small">small</Radio>
        <Radio value="middle">middle</Radio>
        <Radio value="large">large</Radio>
      </RadioGroup>
    </div>
    <Form :disabled="disabled" :size="size" layout="vertical">
      <FormItem label="Username" name="username">
        <Input placeholder="Username" />
      </FormItem>
      <FormItem label="Email" name="email">
        <Input placeholder="Email" />
      </FormItem>
    </Form>
  </div>
</template>
