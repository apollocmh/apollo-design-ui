<script setup lang="ts">
// 对齐 antd 的 demo/variant.tsx：Form 级 variant 传导到所有输入控件。
import { Button, Form, FormItem, Input, Radio, RadioGroup, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const variant = ref<'outlined' | 'borderless' | 'filled' | 'underlined'>('outlined');

const teamOptions = [
  { value: 'design', label: '设计团队' },
  { value: 'engineer', label: '工程团队' },
];
</script>

<template>
  <div class="demo-variant-switch">
    <RadioGroup v-model:value="variant" aria-label="表单变体">
      <Radio value="outlined">outlined</Radio>
      <Radio value="borderless">borderless</Radio>
      <Radio value="filled">filled</Radio>
      <Radio value="underlined">underlined</Radio>
    </RadioGroup>
  </div>
  <Form :variant="variant" layout="vertical" style="max-width: 420px">
    <FormItem label="用户名" name="username">
      <Input aria-label="用户名" placeholder="请输入用户名" />
    </FormItem>
    <FormItem label="团队" name="team">
      <Select aria-label="团队" placeholder="请选择团队" :options="teamOptions" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
  </Form>
</template>

<style scoped>
.demo-variant-switch {
  margin-bottom: 16px;
}
</style>
