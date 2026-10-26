<script setup lang="ts">
import { List, ListItem, type PaginationConfig, Table, type TableProps } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const show = ref(false);
const listCurrent = ref(1);
const listSize = ref(5);
const tableSize = ref(5);
const listChanges = ref(0);
const tableChanges = ref(0);
const listPagination = computed<PaginationConfig>(() => ({
  current: listCurrent.value,
  pageSize: listSize.value,
  showSizeChanger: true,
  onChange: (page, size) => {
    listCurrent.value = page;
    listSize.value = size;
    listChanges.value++;
  },
}));
const onTableChange: TableProps['onChange'] = (next) => {
  tableSize.value = next.pageSize ?? 5;
  tableChanges.value++;
};
const rows = Array.from({ length: 12 }, (_, i) => ({ key: String(i), name: `Row ${i}` }));
const items = rows.map((row) => row.name);
const columns = [{ title: 'Name', dataIndex: 'name' }];
</script>

<template>
  <button @click="show = !show">Toggle container slots</button>
  <section data-pagination-container="list">
    <List :data-source="items" :pagination="listPagination">
      <template #item="{ item }"><ListItem>{{ item }}</ListItem></template>
      <template v-if="show" #paginationTotal="{ total, range }">
        <output data-container-total>{{ range[0] }}-{{ range[1] }} / {{ total }}</output>
      </template>
      <template v-if="show" #paginationItemRender="{ page, type, element }">
        <span :data-container-page="type === 'page' ? page : undefined"><component :is="element" /></span>
      </template>
      <template v-if="show" #paginationSizeChanger="{ value, onSizeChange, disabled }">
        <button data-container-size :disabled="disabled" @click="onSizeChange(value === 5 ? 10 : 5)">List size {{ value }}</button>
      </template>
    </List>
  </section>
  <section data-pagination-container="table">
    <Table :columns="columns" :data-source="rows"
      :pagination="{ pageSize: tableSize, showSizeChanger: true, placement: ['topEnd', 'bottomEnd'] }" @change="onTableChange">
      <template v-if="show" #paginationTotal="{ total, range }">
        <output data-container-total>{{ range[0] }}-{{ range[1] }} / {{ total }}</output>
      </template>
      <template v-if="show" #paginationItemRender="{ page, type, element }">
        <span :data-container-page="type === 'page' ? page : undefined"><component :is="element" /></span>
      </template>
      <template v-if="show" #paginationSizeChanger="{ value, onSizeChange, disabled }">
        <button data-container-size :disabled="disabled" @click="onSizeChange(value === 5 ? 10 : 5)">Table size {{ value }}</button>
      </template>
    </Table>
  </section>
  <output id="container-change-state">{{ JSON.stringify({ listChanges, tableChanges }) }}</output>
</template>
