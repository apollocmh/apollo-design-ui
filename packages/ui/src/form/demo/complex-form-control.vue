<script setup lang="ts">
// 对齐 antd 的 demo/complex-form-control.tsx：
// `getValueProps` 把表单里存储的「分」转换成输入框展示的「元」，
// `getValueFromEvent` 再把输入框的「元」写回成「分」。
import type { FormItemProps } from '@apollo-design/ui';
import { Form, FormItem, InputNumber, useForm, useWatch } from '@apollo-design/ui';

const [form] = useForm();

const getValueProps: NonNullable<FormItemProps['getValueProps']> = (value) => ({
  value: typeof value === 'number' ? value / 100 : undefined,
});

const getValueFromEvent: NonNullable<FormItemProps['getValueFromEvent']> = (value) =>
  typeof value === 'number' ? Math.round(value * 100) : value;

const priceInCents = useWatch('price', form);
</script>

<template>
  <Form :form="form" :initial-values="{ price: 1999 }" layout="vertical">
    <FormItem
      label="金额（元）"
      name="price"
      :get-value-props="getValueProps"
      :get-value-from-event="getValueFromEvent"
      :rules="[{ required: true, message: '请输入金额' }]"
      extra="输入框展示元，表单内部以「分」存储。"
    >
      <InputNumber
        aria-label="金额（元）"
        placeholder="请输入金额"
        :min="0"
        :step="0.01"
        style="width: 200px"
      />
    </FormItem>
    <div class="demo-cents">
      表单存储值：<strong>{{ priceInCents ?? '（空）' }}</strong> 分
    </div>
  </Form>
</template>

<style scoped>
.demo-cents {
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
}
</style>
