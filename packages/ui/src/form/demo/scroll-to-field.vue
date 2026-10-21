<script setup lang="ts">
// 对齐 antd 的 demo/scroll-to-field.tsx
import { Button, Form, FormItem, Input, message, useForm } from '@apollo-design/ui';

const [form] = useForm();
const fields = Array.from({ length: 12 }, (_, index) => `field${index}`);

const scrollToLast = () => {
  form.scrollToField?.('field11', { behavior: 'smooth', block: 'center' });
  message.info('已滚动到 field11');
};
</script>

<template>
  <Form :form="form" layout="vertical">
    <div style="max-height: 240px; overflow: auto; padding-inline-end: 8px">
      <FormItem
        v-for="field in fields"
        :key="field"
        :label="field"
        :name="field"
        :rules="[{ required: true, message: `请输入 ${field}` }]"
      >
        <Input :placeholder="field" />
      </FormItem>
    </div>
    <FormItem>
      <Button type="primary" @click="scrollToLast">Scroll to field11</Button>
    </FormItem>
  </Form>
</template>
