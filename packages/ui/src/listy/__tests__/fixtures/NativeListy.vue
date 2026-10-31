<script setup lang="ts">
import { ref } from 'vue';
import { Listy, type ListyRef } from '../../index';

const items = Array.from({ length: 80 }, (_, id) => ({ id, label: `Row ${id}` }));
const grouped = ref(
  Array.from({ length: 60 }, (_, id) => ({
    id,
    label: `Grouped ${id}`,
    group: Math.floor(id / 20),
  })),
);
const group = { key: (item: (typeof grouped.value)[number]) => item.group };
const raw = ref<ListyRef<number> | null>(null);
const virtual = ref<ListyRef<number> | null>(null);
const alive = ref(true);
function regroup() {
  grouped.value = [...grouped.value]
    .reverse()
    .map((item) => ({ ...item, group: item.id === 0 ? 1 : item.group }));
}
</script>
<template>
  <div style="width: 320px; margin: 30px">
    <Listy data-case="raw" :items="items" row-key="id" :height="120" tabindex="0" aria-label="Raw rows">
      <template #default="{ item }">{{ item.label }}</template>
    </Listy>
    <div style="height: 30px" />
    <Listy data-case="virtual" :items="items" row-key="id" virtual :height="120" tabindex="0" aria-label="Virtual rows">
      <template #default="{ item }">{{ item.label }}</template>
    </Listy>
    <button data-action="regroup" type="button" @click="regroup">Regroup</button>
    <button data-action="scroll-raw" type="button" @click="raw?.scrollTo({ key: 25, align: 'top', offset: 5 })">Raw item 25</button>
    <button data-action="scroll-virtual" type="button" @click="virtual?.scrollTo({ groupKey: 2, align: 'top' })">Virtual group 2</button>
    <button data-action="unmount" type="button" @click="alive = false">Unmount</button>
    <template v-if="alive">
      <Listy ref="raw" data-case="raw-sticky" :items="grouped" row-key="id" :group="group" sticky :height="160">
        <template #default="{ item }"><input :data-editor="item.id" :aria-label="item.label" /></template>
        <template #groupHeader="{ groupKey, sticky, fixed }">
          <input :data-header="groupKey" :aria-label="`Header ${groupKey}`" :data-sticky="sticky" :data-fixed="fixed" />
        </template>
      </Listy>
      <div style="height: 30px" />
      <Listy ref="virtual" data-case="virtual-sticky" :items="grouped" row-key="id" :group="group" virtual sticky :height="160">
        <template #default="{ item }"><span>{{ item.label }}</span></template>
        <template #groupHeader="{ groupKey, sticky, fixed }"><span :data-header="groupKey" :data-sticky="sticky" :data-fixed="fixed">Group {{ groupKey }}</span></template>
      </Listy>
      <div style="height: 30px" />
      <Listy data-case="page-sticky" :items="grouped" row-key="id" :group="group" sticky>
        <template #default="{ item }">{{ item.label }}</template>
        <template #groupHeader="{ groupKey, fixed }"><span :data-header="groupKey" :data-fixed="fixed">Page group {{ groupKey }}</span></template>
      </Listy>
    </template>
    <div style="height: 1800px" />
  </div>
</template>
