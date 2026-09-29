<script setup lang="ts">
import { Form, FormItem, Input, Radio, RadioGroup } from '@apollo-design/ui';
import { reactive, ref } from 'vue';

const formState = reactive({ name: '' });
const layout = ref<'horizontal' | 'vertical' | 'inline'>('horizontal');
</script>

<template>
  <Form :layout="layout" :model="formState">
    <FormItem label="Layout" name="layout">
      <RadioGroup v-model:value="layout">
        <Radio value="horizontal">horizontal</Radio>
        <Radio value="vertical">vertical</Radio>
        <Radio value="inline">inline</Radio>
      </RadioGroup>
    </FormItem>
    <FormItem label="Name" name="name">
      <Input v-model:value="formState.name" placeholder="Name" />
    </FormItem>
  </Form>
</template>
