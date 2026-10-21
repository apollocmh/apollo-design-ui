<script setup lang="ts">
// 对齐 antd 的 demo/login.tsx：登录表单、记住我与成功反馈。
import { Alert, Button, Checkbox, Form, FormItem, Input } from '@apollo-design/ui';
import { ref } from 'vue';

const success = ref('');

const onFinish = (values: unknown) => {
  const data = values as { username?: string; remember?: boolean };
  success.value = `欢迎回来，${data.username ?? '访客'}！记住我：${data.remember ? '是' : '否'}`;
};
</script>

<template>
  <Form
    name="login"
    :initial-values="{ remember: true }"
    layout="vertical"
    style="max-width: 360px"
    @finish="onFinish"
  >
    <FormItem
      label="用户名"
      name="username"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="用户名" autocomplete="username" />
    </FormItem>
    <FormItem
      label="密码"
      name="password"
      :rules="[{ required: true, message: '请输入密码' }]"
    >
      <Input
        aria-label="密码"
        type="password"
        placeholder="密码"
        autocomplete="current-password"
      />
    </FormItem>
    <FormItem name="remember" value-prop-name="checked">
      <Checkbox>记住我</Checkbox>
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit" block>登录</Button>
    </FormItem>
  </Form>
  <Alert v-if="success" type="success" show-icon :title="success" class="demo-login-alert" />
</template>

<style scoped>
.demo-login-alert {
  max-width: 360px;
  margin-top: 16px;
}
</style>
