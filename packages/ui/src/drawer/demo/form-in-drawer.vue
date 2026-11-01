<script setup lang="ts">
import { Alert, Button, Drawer, Form, FormItem, Input, useForm } from '@apollo-design/ui';
import { ref, useId } from 'vue';

const [form] = useForm();
const formId = `drawer-contact-${useId()}`;
const open = ref(false);
const submitted = ref('');
const initialValues = { name: '', email: '' };

function showDrawer() {
  form.resetFields();
  submitted.value = '';
  open.value = true;
}

function handleFinish(values: Record<string, unknown>) {
  submitted.value = `${values.name} · ${values.email}`;
  open.value = false;
}
</script>

<template>
  <div class="contact-form-demo">
    <Button type="primary" @click="showDrawer">新建联系人</Button>
    <Alert v-if="submitted" type="success" show-icon title="示例提交成功" :description="submitted" />
  </div>
  <Drawer title="新建联系人" size="min(100%, 520px)" :open="open" @close="open = false">
    <Form
      :id="formId"
      :name="formId"
      :form="form"
      :initial-values="initialValues"
      layout="vertical"
      novalidate
      @finish="handleFinish"
    >
      <FormItem label="姓名" name="name" :rules="[{ required: true, whitespace: true, message: '请输入姓名' }]">
        <Input aria-label="姓名" autocomplete="name" placeholder="请输入姓名" />
      </FormItem>
      <FormItem
        label="邮箱"
        name="email"
        :rules="[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]"
      >
        <Input aria-label="邮箱" type="email" autocomplete="email" placeholder="name@example.com" />
      </FormItem>
    </Form>
    <template #footer>
      <div class="contact-form-actions">
        <Button class="contact-form-cancel" @click="open = false">取消</Button>
        <Button type="primary" html-type="submit" :form="formId">提交</Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.contact-form-demo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}
.contact-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
