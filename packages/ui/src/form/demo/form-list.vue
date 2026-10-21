<script setup lang="ts">
// 对齐 antd 的 demo/form-list.tsx：动态增删字段
import { MinusCircleOutlined, PlusOutlined } from '@apollo-design/icons';
import { Button, Flex, Form, FormItem, FormList, Input, message, useForm } from '@apollo-design/ui';

const [form] = useForm();
// Form.List 的行由表单 store 初始化（不是模板里的 model 对象）。
const initialValues = {
  users: [{ first: 'Jane', last: 'Doe' }],
};

const onFinish = (values: unknown) => {
  message.success('提交成功');
  console.log('Received values of form:', values);
};
</script>

<template>
  <Form :form="form" :initial-values="initialValues" layout="vertical" @finish="onFinish">
    <FormList name="users">
      <template #default="{ fields, operations }">
        <Flex
          v-for="field in fields"
          :key="field.key"
          align="flex-start"
          gap="small"
          class="demo-list-row"
        >
          <FormItem
            :name="[field.name, 'first']"
            label="First Name"
            :rules="[{ required: true, message: '请输入名' }]"
            style="flex: 1"
          >
            <Input placeholder="first name" />
          </FormItem>
          <FormItem
            :name="[field.name, 'last']"
            label="Last Name"
            :rules="[{ required: true, message: '请输入姓' }]"
            style="flex: 1"
          >
            <Input placeholder="last name" />
          </FormItem>
          <Button
            type="text"
            danger
            :icon="MinusCircleOutlined"
            aria-label="删除该行"
            style="margin-top: 30px"
            @click="operations.remove(field.name)"
          />
        </Flex>
        <FormItem>
          <Button type="dashed" block :icon="PlusOutlined" @click="operations.add()">
            Add field
          </Button>
        </FormItem>
      </template>
    </FormList>
    <FormItem>
      <Button type="primary" html-type="submit">Submit</Button>
    </FormItem>
  </Form>
</template>
