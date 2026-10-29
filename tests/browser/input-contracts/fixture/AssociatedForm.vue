<script setup>
import { Form, FormItem, useForm } from '@input-source/form/index.ts';
import { Input } from '@input-source/input/index.ts';
import { reactive, ref } from 'vue';

const model = reactive({ name: 'Apollo' });
const [form] = useForm();
const input = ref(null);
defineExpose({ model, form, input });
</script>
<template>
  <Form :form="form" :initial-values="model" name="input-association" layout="vertical" style="width: 260px">
    <FormItem name="name" label="Account name" has-feedback :rules="[{ required: true, message: 'Name required' }]">
      <Input ref="input" v-model:value="model.name" allow-clear />
    </FormItem>
  </Form>
</template>
