<script setup lang="ts">
// 对齐 antd 的 `disabled-in-form` demo：Form 级联禁用 AutoComplete。
import type { DefaultOptionType, SelectValue } from '@apollo-design/ui';
import { AutoComplete, Form, FormItem, Switch, Text } from '@apollo-design/ui';
import { reactive, ref } from 'vue';

const disabled = ref(true);
const formState = reactive({ fruit: '' });
const options: DefaultOptionType[] = [{ value: 'Apple' }, { value: 'Banana' }, { value: 'Cherry' }];

const onFruitChange = (value: SelectValue) => {
  formState.fruit = String(value ?? '');
};
</script>

<template>
  <div>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px">
      <Text>Form disabled</Text>
      <Switch v-model:checked="disabled" aria-label="禁用表单" />
    </div>
    <Form :model="formState" :disabled="disabled" layout="vertical" style="max-width: 320px">
      <FormItem label="Fruit" name="fruit">
        <AutoComplete aria-label="自动补全输入框"
          :value="formState.fruit"
          :options="options"
          placeholder="选择或输入水果"
          @update:value="onFruitChange"
        />
      </FormItem>
      <FormItem label="当前值">
        <Text>{{ formState.fruit || '（空）' }}</Text>
      </FormItem>
    </Form>
  </div>
</template>
