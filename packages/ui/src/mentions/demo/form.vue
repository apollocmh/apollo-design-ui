<script setup lang="ts">
// 对齐 antd demo/form.tsx（受控 + 校验）
// ⚠️ demo 级替换：antd 用 `Form.useForm()`；本仓用 `useForm()` + `:form`（见 form/demo/basic.vue）。
import { Button, Form, FormItem, Mentions, Space, useForm } from '@apollo-design/ui';
import { reactive } from 'vue';

const { getMentions } = Mentions;

const formState = reactive({ coders: '' });
const [formRef] = useForm();

const checkMention = async (_: unknown, value: string) => {
  const mentions = getMentions(value);
  if (mentions.length < 2) {
    throw new Error('More than one must be selected!');
  }
};

const options = [
  { value: 'afc163', label: 'afc163' },
  { value: 'zombieJ', label: 'zombieJ' },
  { value: 'yesmeck', label: 'yesmeck' },
];
</script>

<template>
  <Form
    :model="formState"
    :form="formRef"
    layout="horizontal"
    :label-col="{ span: 6 }"
    :wrapper-col="{ span: 16 }"
  >
    <FormItem name="coders" label="Top coders" :rules="[{ validator: checkMention }]">
      <Mentions v-model:value="formState.coders" :rows="1" :options="options" />
    </FormItem>
    <FormItem :wrapper-col="{ span: 14, offset: 6 }">
      <Space>
        <Button type="primary" html-type="submit">Submit</Button>
        <Button html-type="reset">Reset</Button>
      </Space>
    </FormItem>
  </Form>
</template>
