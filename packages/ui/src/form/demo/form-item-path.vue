<script setup lang="ts">
// 对齐 antd 的 demo/form-item-path.tsx：用数组 namePath 读写嵌套字段。
import { Button, Form, FormItem, Input, Space, useForm, useWatch } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const name = useWatch(['user', 'name'], form);
const email = useWatch(['user', 'email'], form);
const snapshot = ref('');

const fillNested = () => {
  form.setFieldsValue({ user: { name: 'Apollo', email: 'apollo@example.com' } });
};

const readNested = () => {
  snapshot.value = JSON.stringify(form.getFieldsValue(true));
};
</script>

<template>
  <Form :form="form" :initial-values="{ user: { name: '', email: '' } }" layout="vertical">
    <FormItem
      label="用户名（user.name）"
      :name="['user', 'name']"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <FormItem
      label="邮箱（user.email）"
      :name="['user', 'email']"
      :rules="[
        { required: true, message: '请输入邮箱' },
        { type: 'email', message: '邮箱格式不正确' },
      ]"
    >
      <Input aria-label="邮箱" placeholder="name@example.com" />
    </FormItem>
    <FormItem>
      <Space>
        <Button @click="fillNested">setFieldsValue 嵌套对象</Button>
        <Button type="primary" @click="readNested">读取整棵值树</Button>
      </Space>
    </FormItem>
    <div class="demo-path-preview">
      <div>useWatch(['user', 'name']) = {{ name ?? '（空）' }}</div>
      <div>useWatch(['user', 'email']) = {{ email ?? '（空）' }}</div>
      <pre v-if="snapshot">{{ snapshot }}</pre>
    </div>
  </Form>
</template>

<style scoped>
.demo-path-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}

.demo-path-preview pre {
  margin: 4px 0 0;
  white-space: pre-wrap;
}
</style>
