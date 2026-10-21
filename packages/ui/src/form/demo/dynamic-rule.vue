<script setup lang="ts">
// 对齐 antd 的 demo/dynamic-rule.tsx：按开关动态切换校验规则。
import type { FormItemProps } from '@apollo-design/ui';
import { Button, Form, FormItem, Input, Switch, useForm } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const [form] = useForm();
const strict = ref(false);
const submitted = ref('');

const rules = computed<FormItemProps['rules']>(() =>
  strict.value
    ? [
        { required: true, message: '请输入密码' },
        { min: 8, message: '严格模式下密码至少 8 位' },
        { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: '严格模式下必须同时包含字母和数字' },
      ]
    : [{ required: true, message: '请输入密码' }],
);

const onFinish = (values: unknown) => {
  submitted.value = JSON.stringify(values);
};
</script>

<template>
  <Form :form="form" layout="vertical" @finish="onFinish">
    <div class="demo-rule-switch">
      <Switch v-model:checked="strict" aria-label="严格校验模式" />
      <span>{{ strict ? '严格模式：至少 8 位且包含字母与数字' : '普通模式：仅必填' }}</span>
    </div>
    <FormItem label="密码" name="password" :rules="rules">
      <Input
        aria-label="密码"
        type="password"
        placeholder="请输入密码"
        autocomplete="new-password"
      />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
    <div class="demo-rule-result">
      {{ submitted ? `提交结果：${submitted}` : '切换开关后再次提交，校验规则会立即变化。' }}
    </div>
  </Form>
</template>

<style scoped>
.demo-rule-switch {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
}

.demo-rule-result {
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}
</style>
