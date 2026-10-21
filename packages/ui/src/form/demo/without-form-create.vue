<script setup lang="ts">
// 对齐 antd 的 demo/without-form-create.tsx：
// 不调用 useForm，Form 自己创建内部 store；通过 key 重新挂载来重置。
import { Alert, Button, Form, FormItem, Input, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const formKey = ref(0);
const submitted = ref('');

const departmentOptions = [
  { value: 'design', label: '设计部' },
  { value: 'engineering', label: '工程部' },
];

const onFinish = (values: unknown) => {
  submitted.value = JSON.stringify(values);
};

const reset = () => {
  submitted.value = '';
  formKey.value += 1;
};
</script>

<template>
  <Form :key="formKey" layout="vertical" @finish="onFinish">
    <FormItem
      label="姓名"
      name="name"
      :rules="[{ required: true, message: '请输入姓名' }]"
    >
      <Input aria-label="姓名" placeholder="请输入姓名" />
    </FormItem>
    <FormItem label="部门" name="department">
      <Select aria-label="部门" placeholder="请选择部门" :options="departmentOptions" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
      <Button style="margin-inline-start: 8px" @click="reset">重置（重新挂载）</Button>
    </FormItem>
    <Alert
      v-if="submitted"
      type="success"
      show-icon
      title="表单提交成功"
      :description="submitted"
    />
  </Form>
</template>
