<script setup lang="ts">
// 对齐 antd 的 demo/initial-values.tsx + resetFields
import { Button, Form, FormItem, Input, Space, useForm } from '@apollo-design/ui';

const [form] = useForm();

const initialValues = { username: 'Apollo', email: 'hello@example.com' };

const fill = () => {
  form.setFieldsValue({ username: 'Filled', email: 'filled@example.com' });
};

const reset = () => {
  form.resetFields();
};
</script>

<template>
  <Form :form="form" :initial-values="initialValues" layout="vertical">
    <FormItem label="Username" name="username">
      <Input placeholder="Username" />
    </FormItem>
    <FormItem label="Email" name="email" :rules="[{ type: 'email', message: '邮箱格式不正确' }]">
      <Input placeholder="Email" />
    </FormItem>
    <FormItem>
      <Space>
        <Button type="primary" html-type="submit">Submit</Button>
        <Button @click="fill">setFieldsValue</Button>
        <Button @click="reset">resetFields</Button>
      </Space>
    </FormItem>
  </Form>
</template>
