const t=`<script setup lang="ts">
import { Button, Form, FormItem, Input, useForm } from '@apollo-design/ui';
import { reactive } from 'vue';

const formState = reactive({ name: '', url: '' });
const [formRef] = useForm();
<\/script>

<template>
  <Form :model="formState" :form="formRef" layout="inline">
    <FormItem name="url" :rules="[{ required: true }]">
      <Input v-model:value="formState.url" placeholder="url" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">Submit</Button>
    </FormItem>
  </Form>
</template>
`;export{t as default};
