<script setup lang="ts">
// 组件 Token：直接在 Form 根元素上覆写 `--apollo-form-*` CSS 变量。
// `ConfigProvider theme.components` 目前只参与主题合并、尚未产出组件 CSS 变量，
// 因此这里与 layout/alert 的 component-token demo 采用同一做法。
import { Button, Form, FormItem, Input, Select } from '@apollo-design/ui';

const verticalTokenStyle = {
  '--apollo-form-label-color': '#722ed1',
  '--apollo-form-label-required-mark-color': '#eb2f96',
  '--apollo-form-label-font-size': '15px',
  '--apollo-form-item-margin-bottom': '16px',
  '--apollo-form-vertical-label-padding': '0 0 4px',
};

const inlineTokenStyle = {
  '--apollo-form-inline-item-margin-bottom': '8px',
  '--apollo-form-label-colon-margin-inline-end': '4px',
};

const genderOptions = [
  { value: 'female', label: '女' },
  { value: 'male', label: '男' },
];
</script>

<template>
  <div class="demo-token-list">
    <Form
      :style="verticalTokenStyle"
      layout="vertical"
      :initial-values="{ name: 'Apollo' }"
    >
      <FormItem label="用户名" name="name" :rules="[{ required: true, message: '请输入用户名' }]">
        <Input aria-label="用户名" placeholder="请输入用户名" />
      </FormItem>
      <FormItem label="性别" name="gender">
        <Select aria-label="性别" placeholder="请选择性别" :options="genderOptions" />
      </FormItem>
    </Form>

    <Form :style="inlineTokenStyle" layout="inline">
      <FormItem label="关键词" name="keyword">
        <Input aria-label="关键词" placeholder="请输入关键词" />
      </FormItem>
      <FormItem>
        <Button type="primary" html-type="submit">查询</Button>
      </FormItem>
    </Form>
  </div>
</template>

<style scoped>
.demo-token-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
