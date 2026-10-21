<script setup lang="ts">
// 对齐 antd 的 demo/useWatch.tsx：实时监听字段值
import { Form, FormItem, Input, useForm, useWatch } from '@apollo-design/ui';
import { reactive } from 'vue';

const [form] = useForm();
const formState = reactive({ username: '', age: '' });

const username = useWatch('username', form);
const age = useWatch('age', form);
</script>

<template>
  <Form :form="form" :model="formState" layout="vertical">
    <FormItem label="Username" name="username">
      <Input v-model:value="formState.username" placeholder="请输入用户名" />
    </FormItem>
    <FormItem label="Age" name="age">
      <Input v-model:value="formState.age" placeholder="请输入年龄" />
    </FormItem>
    <div class="demo-watch-panel">
      <div>useWatch('username') = {{ username ?? '（空）' }}</div>
      <div>useWatch('age') = {{ age ?? '（空）' }}</div>
    </div>
  </Form>
</template>
