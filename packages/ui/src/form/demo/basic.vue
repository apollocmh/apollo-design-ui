<script setup lang="ts">
import { Button, Form, FormItem, Input, useForm } from '@apollo-design/ui';
import { reactive } from 'vue';

const formState = reactive({ name: '', password: '' });
const [formRef] = useForm();

const onFinish = (values: unknown) => {
  console.log('Success:', values);
};
</script>

<template>
  <Form :model="formState" :form="formRef" @finish="onFinish">
    <FormItem label="Username" name="name" :rules="[{ required: true, message: '请输入用户名' }]">
      <Input v-model:value="formState.name" placeholder="Username" />
    </FormItem>
    <FormItem label="Password" name="password" :rules="[{ required: true, message: '请输入密码' }]">
      <Input v-model:value="formState.password" type="password" placeholder="Password" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">Log in</Button>
    </FormItem>
  </Form>
</template>
