<script setup lang="ts">
// 对齐 antd 的 demo/form-context.tsx：
// 子组件不传 form 实例，useWatch 通过 Form 提供的上下文自动读取字段。
import { Form, FormItem, Input, useWatch } from '@apollo-design/ui';
import { defineComponent, h } from 'vue';

const WatchDisplay = defineComponent({
  name: 'WatchDisplay',
  setup() {
    const username = useWatch('username');
    return () =>
      h(
        'div',
        { class: 'demo-context-value' },
        `子组件通过上下文读取 username：${username.value ?? '（空）'}`,
      );
  },
});
</script>

<template>
  <Form :initial-values="{ username: '' }" layout="vertical">
    <FormItem label="用户名" name="username">
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <WatchDisplay />
    <p class="demo-context-tip">
      子组件没有接收 form 参数，`useWatch` 仍然能从 FormContext 读取到最新值。
    </p>
  </Form>
</template>

<style scoped>
.demo-context-value {
  padding: 8px 12px;
  color: #1677ff;
  background: rgb(22 119 255 / 6%);
  border-radius: 6px;
}

.demo-context-tip {
  margin: 8px 0 0;
  color: rgb(0 0 0 / 45%);
  font-size: 12px;
}
</style>
