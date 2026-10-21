<script setup lang="ts">
// 对齐 antd 的 demo/set-fields-value.tsx
import { Button, Form, FormItem, Input, Space, useForm } from '@apollo-design/ui';
import { computed, shallowRef } from 'vue';

const [form] = useForm();
const snapshot = shallowRef('');

const read = () => {
  snapshot.value = JSON.stringify(form.getFieldsValue(true));
};

const write = () => {
  form.setFieldsValue({ username: 'Apollo', email: 'apollo@example.com' });
  read();
};

const output = computed(() => snapshot.value || '（点击按钮读取表单值）');
</script>

<template>
  <Form :form="form" layout="vertical">
    <FormItem label="Username" name="username">
      <Input placeholder="Username" />
    </FormItem>
    <FormItem label="Email" name="email">
      <Input placeholder="Email" />
    </FormItem>
    <FormItem>
      <Space>
        <Button type="primary" @click="read">getFieldsValue</Button>
        <Button @click="write">setFieldsValue</Button>
      </Space>
    </FormItem>
    <div class="demo-result">{{ output }}</div>
  </Form>
</template>
