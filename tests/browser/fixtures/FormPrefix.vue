<script setup lang="ts">
import {
  ConfigProvider,
  Form,
  FormItem,
  type FormLayout,
  Input,
  type ValidateStatus,
} from '@apollo-design/ui';
import { ref } from 'vue';

const prefix = ref('f1');
const itemPrefix = ref('');
const layout = ref<FormLayout>('horizontal');
const status = ref<ValidateStatus>('error');
const showHelp = ref(true);
const value = ref('typed value');
</script>

<template>
  <button @click="prefix = prefix === 'f1' ? 'f2' : 'f1'">Toggle form prefix</button>
  <button @click="showHelp = !showHelp">Toggle help</button>
  <label>Layout <select v-model="layout" aria-label="Form layout">
    <option>horizontal</option><option>vertical</option><option>inline</option>
  </select></label>
  <label>Status <select v-model="status" aria-label="Form status">
    <option>error</option><option>warning</option><option>success</option><option>validating</option>
  </select></label>
  <label>Item prefix <select v-model="itemPrefix" aria-label="Item prefix">
    <option value="">Provider</option><option>custom-a-form</option><option>custom-b-form</option>
  </select></label>
  <ConfigProvider :prefix-cls="prefix">
    <Form :layout="layout">
      <FormItem
        :prefix-cls="itemPrefix || undefined" label="Name" html-for="prefix-name"
        :help="showHelp ? 'Required' : undefined" :validate-status="status" has-feedback
      >
        <Input id="prefix-name" v-model:value="value" aria-label="Name" />
      </FormItem>
    </Form>
  </ConfigProvider>
  <output id="form-prefix-state">{{ JSON.stringify({ prefix, itemPrefix, layout, status, value, showHelp }) }}</output>
</template>

<style>
/* These styles are prebuilt into the test fixture; the UI adds no runtime CSS. */
.f1-form-item { margin-bottom: 24px; }
.f2-form-item { margin-bottom: 40px; }
.f1-form-item-vertical { margin-bottom: 32px; }
.f2-form-item-vertical { margin-bottom: 48px; }
.f1-form-item-inline { margin-bottom: 12px; }
.f2-form-item-inline { margin-bottom: 20px; }
.custom-a-form-item { margin-bottom: 30px; }
.custom-b-form-item { margin-bottom: 42px; }
</style>
