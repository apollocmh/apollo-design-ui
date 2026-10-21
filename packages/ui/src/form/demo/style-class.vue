<script setup lang="ts">
// 对齐 antd 的 demo/style-class.tsx：Form 的 label / content / help / extra 语义槽。
import type { FormSemanticClassNames, FormSemanticStyles } from '@apollo-design/ui';
import { Button, Form, FormItem, Input, Select } from '@apollo-design/ui';

const classNames: FormSemanticClassNames = {
  root: 'demo-form-root',
  label: 'demo-form-label',
  content: 'demo-form-content',
  help: 'demo-form-help',
  helpItem: 'demo-form-help-item',
  extra: 'demo-form-extra',
};

const styles: FormSemanticStyles = {
  label: { fontWeight: 600 },
  content: { maxWidth: '360px' },
  help: { paddingInlineStart: '8px' },
  extra: { color: '#1677ff' },
};

const roleOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'member', label: '成员' },
];
</script>

<template>
  <Form
    :class-names="classNames"
    :styles="styles"
    layout="vertical"
    :initial-values="{ role: 'member' }"
  >
    <FormItem
      label="用户名"
      name="username"
      validate-status="error"
      help="用户名已被占用（help 语义槽）"
      extra="这是 extra 语义槽，可通过 classNames.extra / styles.extra 定制。"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <FormItem label="角色" name="role">
      <Select aria-label="角色" :options="roleOptions" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
  </Form>
</template>

<style scoped>
.demo-form-root {
  padding: 16px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
}
</style>

<style>
.demo-form-label {
  color: #722ed1 !important;
}

.demo-form-content {
  background: rgb(114 46 209 / 4%);
}

.demo-form-help-item {
  font-style: italic;
}

.demo-form-extra {
  font-size: 12px;
}
</style>
