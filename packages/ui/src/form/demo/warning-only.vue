<script setup lang="ts">
// 对齐 antd 的 demo/warning-only.tsx：warningOnly 规则只提示、不阻断提交。
import type { ValidateErrorEntity } from '@apollo-design/form-core';
import { Alert, Button, Form, FormItem, Input, useForm } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const feedback = ref('');
const failed = ref(false);

const onFinish = (values: unknown) => {
  failed.value = false;
  feedback.value = `提交成功：${JSON.stringify(values)}`;
};

const onFinishFailed = (errorInfo: ValidateErrorEntity) => {
  failed.value = true;
  feedback.value = `提交被阻断：${errorInfo.errorFields
    .map((field) => field.errors.join('、'))
    .join('；')}`;
};
</script>

<template>
  <Form :form="form" layout="vertical" @finish="onFinish" @finish-failed="onFinishFailed">
    <FormItem
      label="用户名（必填）"
      name="username"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="不填会阻断提交" />
    </FormItem>
    <FormItem
      label="昵称（建议填写）"
      name="nickname"
      :rules="[{ required: true, warningOnly: true, message: '建议填写昵称' }]"
    >
      <Input aria-label="昵称" placeholder="不填只会出现警告" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
    <Alert
      v-if="feedback"
      :type="failed ? 'error' : 'success'"
      show-icon
      :title="failed ? '提交失败' : '提交成功'"
      :description="feedback"
    />
  </Form>
</template>
