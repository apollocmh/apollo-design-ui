<script setup lang="ts">
// 对齐 antd 的 demo/dynamic-form-items.tsx：Form.List 的增删、排序与 meta.errors。
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  MinusCircleOutlined,
  PlusOutlined,
} from '@apollo-design/icons';
import { Button, Flex, Form, FormItem, FormList, Input, useForm } from '@apollo-design/ui';
import { ref } from 'vue';

const [form] = useForm();
const submitted = ref('');

const initialValues = {
  passengers: [{ name: 'Apollo' }],
};

const onFinish = (values: unknown) => {
  submitted.value = JSON.stringify(values);
};
</script>

<template>
  <Form :form="form" :initial-values="initialValues" layout="vertical" @finish="onFinish">
    <FormList name="passengers">
      <template #default="{ fields, operations, meta }">
        <Flex
          v-for="field in fields"
          :key="field.key"
          align="flex-start"
          gap="small"
          class="demo-list-row"
        >
          <FormItem
            :name="[field.name, 'name']"
            label="乘客姓名"
            :rules="[{ required: true, message: '请输入乘客姓名' }]"
            style="flex: 1"
          >
            <Input aria-label="乘客姓名" placeholder="请输入乘客姓名" />
          </FormItem>
          <Button
            type="text"
            :icon="ArrowUpOutlined"
            aria-label="上移该行"
            :disabled="field.name === 0"
            style="margin-top: 30px"
            @click="operations.move(field.name, field.name - 1)"
          />
          <Button
            type="text"
            :icon="ArrowDownOutlined"
            aria-label="下移该行"
            :disabled="field.name === fields.length - 1"
            style="margin-top: 30px"
            @click="operations.move(field.name, field.name + 1)"
          />
          <Button
            type="text"
            danger
            :icon="MinusCircleOutlined"
            aria-label="删除该行"
            :disabled="fields.length === 1"
            style="margin-top: 30px"
            @click="operations.remove(field.name)"
          />
        </Flex>
        <div v-if="meta.errors?.length" class="demo-list-errors">
          列表级错误：{{ meta.errors.map(String).join('；') }}
        </div>
        <FormItem>
          <Button type="dashed" block :icon="PlusOutlined" @click="operations.add()">
            添加乘客
          </Button>
        </FormItem>
      </template>
    </FormList>
    <FormItem>
      <Button type="primary" html-type="submit">提交</Button>
    </FormItem>
    <div class="demo-list-result">
      {{ submitted ? `提交结果：${submitted}` : '使用行内按钮调整顺序或增删乘客。' }}
    </div>
  </Form>
</template>

<style scoped>
.demo-list-row {
  margin-bottom: 8px;
}

.demo-list-errors {
  margin-bottom: 8px;
  color: #ff4d4f;
}

.demo-list-result {
  padding: 8px 12px;
  color: rgb(0 0 0 / 65%);
  background: rgb(0 0 0 / 3%);
  border-radius: 6px;
  word-break: break-all;
}
</style>
