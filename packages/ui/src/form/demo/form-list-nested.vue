<script setup lang="ts">
// 对齐 antd 的 demo/form-list-nested.tsx：嵌套 namePath
import { MinusCircleOutlined, PlusOutlined } from '@apollo-design/icons';
import { Button, Flex, Form, FormItem, FormList, Input, useForm } from '@apollo-design/ui';

const [form] = useForm();
const initialValues = {
  users: [
    { name: 'Alice', tags: ['frontend'] },
    { name: 'Bob', tags: [] as string[] },
  ],
};
</script>

<template>
  <Form :form="form" :initial-values="initialValues" layout="vertical">
    <FormList name="users">
      <template #default="{ fields, operations }">
        <div v-for="field in fields" :key="field.key" class="demo-nested-card">
          <Flex align="flex-start" gap="small">
            <FormItem
              :name="[field.name, 'name']"
              label="用户名"
              :rules="[{ required: true, message: '请输入用户名' }]"
              style="flex: 1"
            >
              <Input placeholder="user name" />
            </FormItem>
            <Button
              type="text"
              danger
              :icon="MinusCircleOutlined"
              aria-label="删除用户"
              style="margin-top: 30px"
              @click="operations.remove(field.name)"
            />
          </Flex>

          <FormList :name="[field.name, 'tags']">
            <template #default="tagSlot">
              <Flex
                v-for="tagField in tagSlot.fields"
                :key="tagField.key"
                align="flex-start"
                gap="small"
              >
                <FormItem
                  :name="tagField.name"
                  label="标签"
                  :rules="[{ required: true, message: '请输入标签' }]"
                  style="flex: 1"
                >
                  <Input placeholder="tag" />
                </FormItem>
                <Button
                  type="text"
                  danger
                  :icon="MinusCircleOutlined"
                  aria-label="删除标签"
                  style="margin-top: 30px"
                  @click="tagSlot.operations.remove(tagField.name)"
                />
              </Flex>
              <FormItem>
                <Button
                  size="small"
                  type="dashed"
                  :icon="PlusOutlined"
                  @click="tagSlot.operations.add()"
                >
                  Add tag
                </Button>
              </FormItem>
            </template>
          </FormList>
        </div>
        <Button type="dashed" block :icon="PlusOutlined" @click="operations.add()">
          Add user
        </Button>
      </template>
    </FormList>
  </Form>
</template>
