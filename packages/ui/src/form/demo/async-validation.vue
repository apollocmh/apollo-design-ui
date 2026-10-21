<script setup lang="ts">
// 对齐 antd 的 demo/validate-only.tsx + 异步校验
import { Form, FormItem, type FormItemProps, Input } from '@apollo-design/ui';

const rules: FormItemProps['rules'] = [
  { required: true, message: '请输入用户名' },
  {
    validator: (_rule, value) =>
      new Promise<void>((resolve, reject) => {
        window.setTimeout(() => {
          if (value === 'admin') {
            reject(new Error('用户名 admin 已被占用'));
          } else {
            resolve();
          }
        }, 600);
      }),
  },
];
</script>

<template>
  <Form layout="vertical">
    <FormItem label="Username" name="username" :rules="rules" has-feedback>
      <Input placeholder="输入 admin 触发异步失败" />
    </FormItem>
  </Form>
</template>
