<script setup lang="ts">
import type { RequiredMark } from '@apollo-design/ui';
import { Button, Form, FormItem, Input, Radio, RadioGroup } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const markMode = ref<'required' | 'hidden' | 'optional' | 'custom'>('required');

const requiredMark = computed<RequiredMark>(() => {
  if (markMode.value === 'optional') return 'optional';
  return markMode.value === 'required';
});
</script>

<template>
  <div class="demo-mark-switch">
    <RadioGroup v-model:value="markMode" aria-label="必填标记模式">
      <Radio value="required">显示必填星号</Radio>
      <Radio value="hidden">隐藏必填标记</Radio>
      <Radio value="optional">显示 optional</Radio>
      <Radio value="custom">自定义插槽</Radio>
    </RadioGroup>
  </div>
  <Form :required-mark="requiredMark" layout="vertical" style="max-width: 420px">
    <template v-if="markMode === 'custom'" #requiredMark="{ label, required }">
      <component :is="label" />
      <span class="demo-custom-mark">{{ required ? '必填' : '选填' }}</span>
    </template>
    <FormItem
      label="用户名"
      name="username"
      :rules="[{ required: true, message: '请输入用户名' }]"
    >
      <Input aria-label="用户名" placeholder="必填字段" />
    </FormItem>
    <FormItem label="昵称" name="nickname">
      <Input aria-label="昵称" placeholder="可选字段" />
    </FormItem>
    <FormItem
      label="邮箱"
      name="email"
      :rules="[{ required: true, message: '请输入邮箱' }]"
    >
      <Input aria-label="邮箱" placeholder="必填字段" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
  </Form>
</template>

<style scoped>
.demo-mark-switch {
  margin-bottom: 16px;
}
.demo-custom-mark {
  margin-inline-start: 8px;
  color: #722ed1;
  font-size: 12px;
}
</style>
