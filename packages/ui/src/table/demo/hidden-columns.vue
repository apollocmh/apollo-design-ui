<script setup lang="ts">
import type { TableColumnsType } from '@apollo-design/ui';
import { Space, Switch, Table, Tag } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const showAge = ref(true);
const showCity = ref(true);
const showEmail = ref(false);

const columns = computed<TableColumnsType>(() => [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 100, hidden: !showAge.value },
  { title: 'City', dataIndex: 'city', key: 'city', hidden: !showCity.value },
  { title: 'Email', dataIndex: 'email', key: 'email', hidden: !showEmail.value },
]);

const data = [
  { key: '1', name: 'John Brown', age: 32, city: 'New York', email: 'john@example.com' },
  { key: '2', name: 'Jim Green', age: 42, city: 'London', email: 'jim@example.com' },
  { key: '3', name: 'Joe Black', age: 28, city: 'Sydney', email: 'joe@example.com' },
  { key: '4', name: 'Jim Red', age: 32, city: 'London', email: 'red@example.com' },
];

const visibleCount = computed(
  () => [true, showAge.value, showCity.value, showEmail.value].filter(Boolean).length,
);
</script>

<template>
  <div>
    <Space :size="16" wrap style="margin-bottom: 16px">
      <Space :size="6">
        <Switch v-model:checked="showAge" aria-label="显示年龄列" />
        <span>Age</span>
      </Space>
      <Space :size="6">
        <Switch v-model:checked="showCity" aria-label="显示城市列" />
        <span>City</span>
      </Space>
      <Space :size="6">
        <Switch v-model:checked="showEmail" aria-label="显示邮箱列" />
        <span>Email</span>
      </Space>
      <Tag color="blue">{{ visibleCount }} / 4 列可见</Tag>
    </Space>

    <Table :columns="columns" :data-source="data" :pagination="false" />
  </div>
</template>
