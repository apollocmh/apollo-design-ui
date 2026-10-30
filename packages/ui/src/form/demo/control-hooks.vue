<script setup lang="ts">
// 对齐 antd 的 demo/control-hooks.tsx：通过 useForm 暴露的实例方法操作表单。
import { Button, Form, FormItem, Input, Space, useForm } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const output = ref('（尚未调用表单方法）');

const readValues = () => {
  output.value = `getFieldsValue：${JSON.stringify(form.getFieldsValue(true))}`;
};

const fillValues = () => {
  form.setFieldsValue({ username: 'Apollo', email: 'apollo@example.com' });
  readValues();
};

const validate = async () => {
  try {
    const values = await form.validateFields();
    output.value = `validateFields 通过：${JSON.stringify(values)}`;
  } catch (error) {
    const errorFields = (error as { errorFields?: unknown }).errorFields ?? error;
    output.value = `validateFields 失败：${JSON.stringify(errorFields)}`;
  }
};

const validateOnly = async () => {
  try {
    await form.validateFields({ validateOnly: true });
    output.value = 'validateOnly 通过：只校验、不抛出字段值。';
  } catch (error) {
    const errorFields = (error as { errorFields?: unknown }).errorFields ?? error;
    output.value = `validateOnly 失败：${JSON.stringify(errorFields)}`;
  }
};

const reset = () => {
  form.resetFields();
  output.value = 'resetFields：已恢复初始值。';
};
</script>

<template>
  <Form :form="form" layout="vertical" render-props v-slot="{ values }">
    <FormItem
      label="用户名"
      name="username"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <FormItem
      label="邮箱"
      name="email"
      :rules="[
        { required: true, message: '请输入邮箱' },
        { type: 'email', message: '邮箱格式不正确' },
      ]"
    >
      <Input aria-label="邮箱" placeholder="请输入邮箱" />
    </FormItem>
    <FormItem>
      <Space wrap>
        <Button @click="fillValues">setFieldsValue</Button>
        <Button @click="readValues">getFieldsValue</Button>
        <Button type="primary" @click="validate">validateFields</Button>
        <Button @click="validateOnly">validateOnly</Button>
        <Button danger @click="reset">resetFields</Button>
      </Space>
    </FormItem>
    <pre class="demo-method-output">{{ output }}</pre>
    <output>当前表单值：{{ JSON.stringify(values) }}</output>
  </Form>
</template>

<style scoped>
.demo-method-output {
  min-height: 48px;
  margin: 0;
  padding: 8px 12px;
  overflow: auto;
  color: rgb(0 0 0 / 65%);
  white-space: pre-wrap;
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}
</style>
