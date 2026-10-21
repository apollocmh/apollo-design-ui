<script setup lang="ts">
// 对齐 antd 的 demo/layout-multiple.tsx：同一页面并列三种 layout。
import { Button, Form, FormItem, Input } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-layout-list">
    <section>
      <h4>Inline</h4>
      <Form layout="inline">
        <FormItem label="用户名" name="inlineUser">
          <Input aria-label="inline 用户名" placeholder="Username" />
        </FormItem>
        <FormItem label="密码" name="inlinePassword">
          <Input
            aria-label="inline 密码"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
          />
        </FormItem>
        <FormItem>
          <Button type="primary" html-type="submit">登录</Button>
        </FormItem>
      </Form>
    </section>

    <section>
      <h4>Horizontal</h4>
      <Form layout="horizontal" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
        <FormItem label="用户名" name="horizontalUser">
          <Input aria-label="horizontal 用户名" placeholder="Username" />
        </FormItem>
        <FormItem label="密码" name="horizontalPassword">
          <Input
            aria-label="horizontal 密码"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
          />
        </FormItem>
      </Form>
    </section>

    <section>
      <h4>Vertical</h4>
      <Form layout="vertical">
        <FormItem label="用户名" name="verticalUser">
          <Input aria-label="vertical 用户名" placeholder="Username" />
        </FormItem>
        <FormItem label="密码" name="verticalPassword">
          <Input
            aria-label="vertical 密码"
            type="password"
            placeholder="Password"
            autocomplete="new-password"
          />
        </FormItem>
      </Form>
    </section>
  </div>
</template>

<style scoped>
.demo-layout-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.demo-layout-list h4 {
  margin: 0 0 12px;
}
</style>
