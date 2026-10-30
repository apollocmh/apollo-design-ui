<script setup lang="ts">
// 对齐 antd 的 demo/finish-failed.tsx
import type { ValidateErrorEntity } from '@apollo-design/form-core';
import { Button, Form, FormItem, Input, useForm } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const errorInfo = ref('');

const onFinish = (values: unknown) => {
  errorInfo.value = `提交成功：${JSON.stringify(values)}`;
};

const onFinishFailed = (errorInfoValue: ValidateErrorEntity) => {
  errorInfo.value = `校验失败：${errorInfoValue.errorFields
    .map((field) => field.errors.join('、'))
    .join('；')}`;
};
</script>

<template>
  <Form
    :form="form"
    layout="vertical"
    scroll-to-first-error
    @finish="onFinish"
    @finish-failed="onFinishFailed"
  >
    <FormItem
      label="Username"
      name="username"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input placeholder="Username" />
    </FormItem>
    <FormItem
      label="Email"
      name="email"
      :rules="[
        { required: true, message: '请输入邮箱' },
        { type: 'email', message: '邮箱格式不正确' },
      ]"
    >
      <Input placeholder="Email" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">Submit</Button>
    </FormItem>
    <div v-if="errorInfo" class="demo-result">{{ errorInfo }}</div>
  </Form>
</template>
