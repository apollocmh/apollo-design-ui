<script setup lang="ts">
import { ref } from 'vue';
import { Listy, type ListyRef } from '../../index';

interface Row {
  id: number;
  title: string;
  payload: { value: number };
  group: 'a' | 'b';
}
const items: Row[] = [{ id: 1, title: 'Row', payload: { value: 1 }, group: 'a' }];
const group = { key: (row: Row) => row.group };
const list = ref<ListyRef<'a' | 'b'> | null>(null);
const onScroll = (event: Event) => {
  if (event.target instanceof HTMLElement) event.target.scrollTop;
};
const scroll = () => list.value?.scrollTo({ groupKey: 'a', align: 'top' });
</script>
<template>
  <Listy ref="list" :items="items" row-key="id" :group="group" @scroll="onScroll">
    <template #default="{ item, index }">
      {{ item.title.toUpperCase() }} {{ index.toFixed() }}
      <!-- @vue-expect-error The actual item does not have a made-up field. -->
      {{ item.missing }}
      <!-- @vue-expect-error The actual title is a string. -->
      {{ item.title.toFixed() }}
    </template>
    <template #groupHeader="{ groupKey, items: grouped, sticky, fixed }">
      {{ groupKey.toUpperCase() }} {{ grouped[0]?.title }} {{ sticky }} {{ fixed }}
      <!-- @vue-expect-error Group key follows the key algorithm and is a string. -->
      {{ groupKey.toFixed() }}
    </template>
  </Listy>
  <Listy :items="[1, 2]" :row-key="value => value"><template #default="{ item }">{{ item.toFixed() }}</template></Listy>
  <!-- @vue-expect-error An object-valued field is not a stable row key. -->
  <Listy :items="items" row-key="payload" />
  <button type="button" @click="scroll">Scroll</button>
</template>
