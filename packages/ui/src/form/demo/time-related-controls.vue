<script setup lang="ts">
// 对齐 antd 的 demo/time-related-controls.tsx：
// DatePicker / TimePicker / RangePicker 作为 Form.Item 控件时的取值与回显。
import {
  Button,
  DatePicker,
  Form,
  FormItem,
  TimePicker,
  useForm,
  useWatch,
} from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const dateValue = useWatch('date', form);
const timeValue = useWatch('time', form);
const rangeValue = useWatch('range', form);
const submitted = ref('');

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return '（空）';
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(' → ');
  }
  return String(value);
};

const onFinish = (values: unknown) => {
  submitted.value = JSON.stringify(values);
};
</script>

<template>
  <Form :form="form" layout="vertical" @finish="onFinish">
    <FormItem label="日期时间" name="date">
      <DatePicker show-time format="YYYY-MM-DD HH:mm" placeholder="请选择日期时间" />
    </FormItem>
    <FormItem label="时间" name="time">
      <TimePicker format="HH:mm" placeholder="请选择时间" />
    </FormItem>
    <FormItem label="日期区间" name="range">
      <DatePicker.RangePicker :placeholder="['开始日期', '结束日期']" />
    </FormItem>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
    <div class="demo-time-preview">
      <div>date = {{ formatValue(dateValue) }}</div>
      <div>time = {{ formatValue(timeValue) }}</div>
      <div>range = {{ formatValue(rangeValue) }}</div>
      <div v-if="submitted">提交结果：{{ submitted }}</div>
    </div>
  </Form>
</template>

<style scoped>
.demo-time-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}
</style>
