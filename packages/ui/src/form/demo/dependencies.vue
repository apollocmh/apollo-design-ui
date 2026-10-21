<script setup lang="ts">
// 对齐 antd 的 demo/dependencies.tsx：字段联动校验
import { Form, FormItem, type FormItemProps, Input, useForm } from '@apollo-design/ui';
import { reactive } from 'vue';

const [form] = useForm();
const formState = reactive({ password: '', confirm: '' });

const confirmRules: FormItemProps['rules'] = [
  { required: true, message: '请再次输入密码' },
  {
    validator: (_rule, value) =>
      value === form.getFieldValue('password')
        ? Promise.resolve()
        : Promise.reject(new Error('两次输入的密码不一致')),
  },
];
</script>

<template>
  <Form :form="form" :model="formState" layout="vertical">
    <FormItem
      label="Password"
      name="password"
      :rules="[{ required: true, message: '请输入密码' }]"
    >
      <Input v-model:value="formState.password" type="password" placeholder="Password" />
    </FormItem>
    <FormItem
      label="Confirm"
      name="confirm"
      :dependencies="['password']"
      :rules="confirmRules"
    >
      <Input v-model:value="formState.confirm" type="password" placeholder="Confirm password" />
    </FormItem>
  </Form>
</template>
