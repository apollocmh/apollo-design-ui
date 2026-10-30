<script setup lang="ts">
import type { ColumnsType } from '../../interface';
import Table from '../../Table';

interface User {
  id: string;
  name: string;
  age: number;
}
const users: User[] = [{ id: 'a', name: 'Alpha', age: 10 }];
const columns: ColumnsType<User> = [{ key: 'name', render: (_value, record) => record.name }];
</script>
<template>
  <Table :data-source="users" :columns="columns" row-key="id">
    <template #bodyCell="{record, originNode}">
      <span>{{record.name.toUpperCase()}}</span>
      <span v-if="originNode === null">Empty</span>
      <!-- @vue-expect-error A native table slot record is User, without an index signature. -->
      <span :data-invalid="record.missing" />
      <!-- @vue-expect-error User.name is a string in the actual native slot. -->
      <span :data-invalid="record.name.toFixed(2)" />
    </template>
  </Table>
</template>
