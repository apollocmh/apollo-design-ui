<script setup lang="ts">
import { computed, defineComponent, h, ref, shallowRef } from 'vue';
import { NodeRenderer } from '../../../_internal/node-renderer';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import HeadDemo from '../../demo/head.vue';
import type { ColumnsType, TableKey, TableProps, TableRef, TableSticky } from '../../interface';
import Table from '../../Table';
import NativeTable from './NativeTable.vue';

interface User {
  id: string;
  name: string;
  age: number;
}
const NativeFixture = NativeTable;
const native = ref<InstanceType<typeof NativeFixture> | null>(null);
const instance = shallowRef<TableRef | null>(null);
const hostA = ref<HTMLElement | null>(null);
const hostB = ref<HTMLElement | null>(null);
const useHostB = ref(false);
const virtual = ref(false);
const section = ref(false);
const replacement = ref(false);
const acceptSelection = ref(false);
const selected = ref<TableKey[]>([]);
const acceptedEvents: Array<{ action: string; ids: string[] }> = [];
const selectionEvents: TableKey[][] = [];
const scrollEvents: Event[] = [];
const rows = ref<User[]>(
  Array.from({ length: 50 }, (_unused, index) => ({
    id: `row-${index}`,
    name: `User ${index}`,
    age: index,
  })),
);
const columns: ColumnsType<User> = [
  {
    key: 'name',
    dataIndex: 'name',
    title: 'Name',
    width: 220,
    fixed: 'left',
    filters: [
      { text: 'First user', value: 'row-0' },
      { text: 'Second user', value: 'row-1' },
    ],
    onFilter: (value, record) => record.id === value,
  },
  {
    key: 'age',
    dataIndex: 'age',
    title: 'Age',
    width: 120,
    responsive: ['md'],
    sorter: (a, b) => a.age - b.age,
  },
  { key: 'tail', dataIndex: 'name', title: 'Tail', width: 860 },
];
const BodyWrapper = defineComponent({
  name: 'TableBrowserBodyWrapper',
  inheritAttrs: false,
  setup:
    (_props, { attrs, slots }) =>
    () =>
      h(section.value ? 'section' : 'div', attrs, slots.default?.()),
});
const components = computed(() => (virtual.value ? { body: { wrapper: BodyWrapper } } : undefined));
const sticky = computed<TableSticky>(() => {
  const container = useHostB.value ? hostB.value : hostA.value;
  return {
    offsetHeader: replacement.value ? 16 : 8,
    ...(container ? { getContainer: () => container } : {}),
  };
});
const theme = computed(() => ({
  components: {
    Table: replacement.value
      ? { headerBg: '#654321', cellPaddingBlock: 0 }
      : { headerBg: '#123456', cellPaddingBlock: 12 },
  },
}));
const change: TableProps<User>['onChange'] = (_pagination, _filters, _sorter, extra) =>
  acceptedEvents.push({
    action: extra.action,
    ids: extra.currentDataSource.map((record) => record.id),
  });
const selection = computed(() => ({
  selectedRowKeys: selected.value,
  onChange: (keys: TableKey[]) => {
    selectionEvents.push(keys);
    if (acceptSelection.value) selected.value = keys;
  },
}));
function patch(kind: string) {
  if (kind === 'records') native.value?.replace();
  if (kind === 'slots') native.value?.patch();
  if (kind === 'theme') replacement.value = !replacement.value;
  if (kind === 'virtual') virtual.value = !virtual.value;
  if (kind === 'wrapper') section.value = !section.value;
  if (kind === 'container') useHostB.value = !useHostB.value;
  if (kind === 'accept') acceptSelection.value = true;
}
function scrollTo(config: Parameters<TableRef['scrollTo']>[0]) {
  instance.value?.scrollTo(config);
}
function currentBody() {
  return (
    instance.value
      ?.nativeElement()
      ?.querySelector<HTMLElement>('.apollo-table-tbody-virtual-holder, .apollo-table-body') ?? null
  );
}
function snapshot() {
  const body = currentBody();
  return {
    virtual: virtual.value,
    bodyTag: body?.tagName,
    scrollTop: body?.scrollTop,
    events: acceptedEvents,
    selection: selectionEvents,
    scrollEvents: scrollEvents.map((event) => ({
      native: event instanceof Event,
      target: event.target instanceof Element ? event.target.className : null,
    })),
  };
}
defineExpose({
  patch,
  scrollTo,
  snapshot,
  ready: () => Boolean(instance.value?.nativeElement() && native.value?.native()),
  nativeRoot: () => instance.value?.nativeElement() ?? null,
});
</script>
<template>
  <NativeFixture ref="native" />
  <ConfigProvider :theme="theme">
    <div id="table-scroll-a" ref="hostA" class="table-scroll-host">
      <Table ref="instance" class="table-engine" :columns="columns" :data-source="rows" row-key="id" :pagination="false" :virtual="virtual" :scroll="{x:1200,y:180}" :sticky="sticky" :components="components" :row-selection="selection" @change="change" @scroll="scrollEvents.push($event)">
        <template #bodyCell="{record,column,originNode}"><input v-if="column.key==='name'" :aria-label="`Record ${record.id}`" :placeholder="record.name"/><span v-else-if="column.key==='age'">{{record.age}}</span><NodeRenderer v-else :node="originNode"/></template>
      </Table>
    </div>
    <div id="table-scroll-b" ref="hostB" class="table-scroll-host other-scroll-host">Alternate sticky container</div>
  </ConfigProvider>
  <div id="table-head-demo"><HeadDemo/></div>
</template>
<style scoped>
.table-scroll-host{max-width:900px;height:350px;overflow:auto;border:1px solid #ddd;margin-block:20px}
.other-scroll-host{height:30px}
input{max-width:170px}
</style>
