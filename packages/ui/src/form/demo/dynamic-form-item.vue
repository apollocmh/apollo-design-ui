<script setup lang="ts">
// 对齐 antd 的 demo/dynamic-form-item.tsx：用 useWatch 监听字段值，条件渲染 Form.Item。
import { Button, Form, FormItem, Input, Select, useForm, useWatch } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const accountType = useWatch('accountType', form);
const submitted = ref('');

const accountOptions = [
  { value: 'personal', label: '个人账号' },
  { value: 'company', label: '企业账号' },
];

const onFinish = (values: unknown) => {
  submitted.value = JSON.stringify(values);
};
</script>

<template>
  <Form
    :form="form"
    :initial-values="{ accountType: 'personal' }"
    layout="vertical"
    @finish="onFinish"
  >
    <FormItem label="账号类型" name="accountType" :rules="[{ required: true }]">
      <Select aria-label="账号类型" :options="accountOptions" />
    </FormItem>
    <FormItem
      label="用户名"
      name="username"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <FormItem
      v-if="accountType === 'company'"
      label="公司名称"
      name="companyName"
      :rules="[{ required: true, message: '企业账号必须填写公司名称' }]"
    >
      <Input aria-label="公司名称" placeholder="请输入公司名称" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
    <div class="demo-dynamic-result">
      {{ submitted ? `提交结果：${submitted}` : '切换账号类型，观察公司名称字段的动态出现。' }}
    </div>
  </Form>
</template>

<style scoped>
.demo-dynamic-result {
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}
</style>
