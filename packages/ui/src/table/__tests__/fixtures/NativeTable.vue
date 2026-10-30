<script setup lang="ts">
import { computed, h, ref, shallowRef, type VNodeChild } from 'vue';
import { Summary } from '../../engine/Footer';
import type { ColumnsType, TableProps, TableRef } from '../../interface';
import Table from '../../Table';

interface User {
  id: string;
  name: string;
  age: number;
}
const rows = ref<User[]>([
  { id: 'a', name: 'Alpha', age: 10 },
  { id: 'b', name: 'Beta', age: 20 },
]);
const instance = shallowRef<TableRef | null>(null);
const phase = ref(0);
const expanded = ref<string[]>(['a']);
const selected = ref<(string | number)[]>([]);
const columns: ColumnsType<User> = [
  { key: 'name', dataIndex: 'name', title: 'Name', render: (_value, record) => record.name },
  { key: 'age', dataIndex: 'age', title: 'Age', sorter: (a, b) => a.age - b.age },
];
const onRow: TableProps<User>['onRow'] = (record, index) => ({
  'data-user-id': record.id,
  'data-current-index': index,
});
const expandable = computed(() => ({
  expandedRowKeys: expanded.value,
  onExpandedRowsChange: (keys: (string | number)[]) => {
    expanded.value = keys.map(String);
  },
}));
const rowSelection = computed(() => ({
  selectedRowKeys: selected.value,
  onChange: (keys: (string | number)[]) => {
    selected.value = keys;
  },
}));
const RenderNode = (props: { node: VNodeChild }) => props.node;
function replace() {
  rows.value = [
    { id: 'b', name: 'New Beta', age: 30 },
    { id: 'a', name: 'New Alpha', age: 40 },
  ];
}
function patch() {
  phase.value = (phase.value + 1) % 3;
}
function native() {
  return instance.value?.nativeElement() ?? null;
}
defineExpose({ replace, patch, native, selected: () => selected.value });
</script>
<template>
 <Table ref="instance" row-key="id" :columns="columns" :data-source="rows" :pagination="false" :expandable="expandable" :row-selection="rowSelection" :on-row="onRow" data-native-table="yes" class="native-table" :style="['width:100%',{'--native-table':'yes'}]">
  <template #title="{data}"><span data-title>{{data.length}} users {{phase}}</span></template>
  <template #headerCell="{column,title}"><span :data-column="String(column.key)"><RenderNode :node="title"/> {{phase}}</span></template>
  <template #bodyCell="{record,column,originNode}"><input v-if="column.key==='name'" :aria-label="record.id" :placeholder="record.name"/><RenderNode v-else-if="phase!==2" :node="originNode"/></template>
  <template #expandedRow="{record,expanded}"><section :data-expanded-user="record.id"><span>{{record.name}} {{expanded}} {{phase}}</span><input :aria-label="`Detail ${record.id}`"/></section></template>
  <template #expandIcon="{record,expanded,expandable,onExpand}"><button v-if="expandable&&phase!==2" type="button" :data-expand="record.id" :aria-expanded="expanded" @click.stop="onExpand(record,$event)">{{expanded?'Close':'Open'}}</button></template>
  <template #summary="{data}"><Summary><Summary.Row><Summary.Cell :index="0" :col-span="4"><span data-summary>{{data.length}} {{phase}}</span></Summary.Cell></Summary.Row></Summary></template>
  <template #footer="{data}"><span data-footer>{{data[0]?.name}} {{phase}}</span></template>
 </Table>
</template>
