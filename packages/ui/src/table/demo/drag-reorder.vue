<script setup lang="ts">
import { Button, Flex, Table, type TableColumnsType } from '@apollo-design/ui';
import { computed, ref } from 'vue';

type Row = { key: string; name: string; age: number; city: string };
type Axis = 'row' | 'column';
const rows: Row[] = [
  { key: 'a', name: 'Alice', age: 28, city: 'Shanghai' },
  { key: 'b', name: 'Bob', age: 32, city: 'Beijing' },
  { key: 'c', name: 'Carol', age: 25, city: 'Hangzhou' },
];
const definitions = [
  { key: 'name', dataIndex: 'name', title: 'Name' },
  { key: 'age', dataIndex: 'age', title: 'Age' },
  { key: 'city', dataIndex: 'city', title: 'City' },
] satisfies TableColumnsType;
const rowOrder = ref(['a', 'b', 'c']);
const columnOrder = ref(['name', 'age', 'city']);
const selectedRow = ref('a');
const selectedColumn = ref('name');
const dragging = ref<{ axis: Axis; key: string } | null>(null);
const dataSource = computed(() =>
  rowOrder.value.flatMap((key) => rows.filter((row) => row.key === key)),
);

function move(axis: Axis, key: string, target: string): void {
  const order = axis === 'row' ? rowOrder : columnOrder;
  const from = order.value.indexOf(key);
  const to = order.value.indexOf(target);
  if (from < 0 || to < 0 || from === to) return;
  const next = order.value.filter((value) => value !== key);
  next.splice(to, 0, key);
  order.value = next;
}

function moveSelected(axis: Axis, offset: number): void {
  const order = axis === 'row' ? rowOrder.value : columnOrder.value;
  const key = axis === 'row' ? selectedRow.value : selectedColumn.value;
  const target = order[order.indexOf(key) + offset];
  if (target) move(axis, key, target);
}

function dragAttrs(axis: Axis, key: string): Record<string, unknown> {
  return {
    draggable: true,
    'data-drag-key': `${axis}:${key}`,
    onDragstart: (event: DragEvent) => {
      dragging.value = { axis, key };
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${axis}:${key}`);
      }
    },
    onDragover: (event: DragEvent) => {
      if (dragging.value?.axis === axis) event.preventDefault();
    },
    onDrop: (event: DragEvent) => {
      if (dragging.value?.axis !== axis) return;
      event.preventDefault();
      move(axis, dragging.value.key, key);
      dragging.value = null;
    },
    onDragend: () => {
      dragging.value = null;
    },
  };
}

const columns = computed<TableColumnsType>(() =>
  columnOrder.value.flatMap((key) => {
    const column = definitions.find((entry) => entry.key === key);
    return column ? [{ ...column, onHeaderCell: () => dragAttrs('column', key) }] : [];
  }),
);
const onRow = (row: Record<string, unknown>) =>
  typeof row.key === 'string' ? dragAttrs('row', row.key) : {};
const reset = () => {
  rowOrder.value = ['a', 'b', 'c'];
  columnOrder.value = ['name', 'age', 'city'];
  dragging.value = null;
};
</script>

<template>
  <Flex vertical gap="small">
    <p>拖动行或列头调整顺序，也可选择条目后使用按钮。Drag rows or headers, or use the controls.</p>
    <Flex wrap gap="small" align="center">
      <label>Row <select v-model="selectedRow" aria-label="Row to move"><option v-for="row in rows" :key="row.key" :value="row.key">{{ row.name }}</option></select></label>
      <Button :disabled="rowOrder.indexOf(selectedRow) === 0" @click="moveSelected('row', -1)">Move row up</Button>
      <Button :disabled="rowOrder.indexOf(selectedRow) === rowOrder.length - 1" @click="moveSelected('row', 1)">Move row down</Button>
      <label>Column <select v-model="selectedColumn" aria-label="Column to move"><option v-for="column in definitions" :key="column.key" :value="column.key">{{ column.title }}</option></select></label>
      <Button :disabled="columnOrder.indexOf(selectedColumn) === 0" @click="moveSelected('column', -1)">Move column left</Button>
      <Button :disabled="columnOrder.indexOf(selectedColumn) === columnOrder.length - 1" @click="moveSelected('column', 1)">Move column right</Button>
      <Button @click="reset">Reset order</Button>
    </Flex>
    <Table :columns="columns" :data-source="dataSource" :on-row="onRow" :pagination="false" row-key="key" />
    <output aria-live="polite">Rows: {{ rowOrder.join(',') }}; Columns: {{ columnOrder.join(',') }}</output>
  </Flex>
</template>
