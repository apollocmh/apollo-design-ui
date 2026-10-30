<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { Button, ConfigProvider, Form, FormItem, Input, Select } from '@apollo-design/ui';

const theme: ThemeConfig = {
  components: {
    Form: {
      labelColor: '#722ed1',
      labelRequiredMarkColor: '#eb2f96',
      labelFontSize: 15,
      itemMarginBottom: 16,
      verticalLabelPadding: '0 0 4px',
      inlineItemMarginBottom: 8,
      labelColonMarginInlineEnd: 4,
    },
  },
};

const genderOptions = [
  { value: 'female', label: '女' },
  { value: 'male', label: '男' },
];
</script>

<template>
  <ConfigProvider :theme="theme">
    <div class="demo-token-list">
      <Form layout="vertical" :initial-values="{ name: 'Apollo' }">
        <FormItem label="用户名" name="name" :rules="[{ required: true, message: '请输入用户名' }]">
          <Input aria-label="用户名" placeholder="请输入用户名" />
        </FormItem>
        <FormItem label="性别" name="gender">
          <Select aria-label="性别" placeholder="请选择性别" :options="genderOptions" />
        </FormItem>
      </Form>

      <Form layout="inline">
        <FormItem label="关键词" name="keyword">
          <Input aria-label="关键词" placeholder="请输入关键词" />
        </FormItem>
        <FormItem>
          <Button type="primary" html-type="submit">查询</Button>
        </FormItem>
      </Form>
    </div>
  </ConfigProvider>
</template>

<style scoped>
.demo-token-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
</style>
