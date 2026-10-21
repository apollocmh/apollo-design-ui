<script setup lang="ts">
// biome-ignore-all lint/suspicious/noTemplateCurlyInString: validateMessages 的 `${name}` / `${min}` 是运行时占位符，必须保持字面量。
// 对齐 antd 的 demo/nest-messages.tsx：Form 级 validateMessages 的嵌套模板。
import type { FormProps } from '@apollo-design/ui';
import { Alert, Button, Form, FormItem, Input, InputNumber } from '@apollo-design/ui';
import { ref } from 'vue';

const messages: NonNullable<FormProps['validateMessages']> = {
  required: "'${name}' 是必填项",
  types: {
    email: "'${name}' 不是有效的邮箱地址",
  },
  string: {
    min: "'${name}' 至少需要 ${min} 个字符",
  },
  number: {
    min: "'${name}' 不能小于 ${min}",
  },
};

const feedback = ref('');
const failed = ref(false);

const onFinish = (values: unknown) => {
  failed.value = false;
  feedback.value = `提交成功：${JSON.stringify(values)}`;
};

const onFinishFailed = (errorInfo: { errorFields: { name: unknown[]; errors: string[] }[] }) => {
  failed.value = true;
  feedback.value = errorInfo.errorFields
    .map((field) => `${field.name.join('.')}：${field.errors.join('、')}`)
    .join('；');
};
</script>

<template>
  <Form
    layout="vertical"
    :validate-messages="messages"
    @finish="onFinish"
    @finish-failed="onFinishFailed"
  >
    <FormItem label="用户名" name="username" :rules="[{ required: true }]">
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <FormItem
      label="邮箱"
      name="email"
      :rules="[{ required: true }, { type: 'email' }]"
    >
      <Input aria-label="邮箱" placeholder="name@example.com" />
    </FormItem>
    <FormItem
      label="年龄"
      name="age"
      :rules="[{ required: true }, { type: 'number', min: 18 }]"
    >
      <InputNumber aria-label="年龄" :min="0" style="width: 160px" />
    </FormItem>
    <FormItem
      label="密码"
      name="password"
      :rules="[{ required: true }, { min: 6 }]"
    >
      <Input
        aria-label="密码"
        type="password"
        placeholder="至少 6 个字符"
        autocomplete="new-password"
      />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
    <Alert
      v-if="feedback"
      :type="failed ? 'error' : 'success'"
      show-icon
      :title="failed ? '校验失败' : '校验通过'"
      :description="feedback"
    />
  </Form>
</template>
