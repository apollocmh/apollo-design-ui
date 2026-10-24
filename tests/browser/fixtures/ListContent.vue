<script setup lang="ts">
import { List, ListItem, type ListRef } from '@apollo-design/ui';
import { ref } from 'vue';

const visible = ref(false);
const empty = ref(false);
const label = ref('first');
const rows = ref([
  { id: 0, title: 'Alpha' },
  { id: '', title: 'Beta' },
]);
const list = ref<ListRef>();
const reverse = () => {
  rows.value = [...rows.value].reverse();
};
</script>

<template>
  <button @click="visible = !visible">Toggle slots</button>
  <button @click="empty = !empty">Toggle empty</button>
  <button @click="label = label === 'first' ? 'second' : 'first'">Update label</button>
  <button @click="reverse">Reverse rows</button>
  <output>{{ list?.nativeElement?.id }}</output>
  <List id="slot-list" ref="list" :data-source="rows" row-key="id" header="prop header" footer="prop footer" load-more="prop more">
    <template v-if="visible" #header><b v-if="!empty">{{ label }}</b></template>
    <template v-if="visible" #footer><small v-if="!empty">{{ label }}</small></template>
    <template v-if="visible" #loadMore><a v-if="!empty" href="#more">{{ label }}</a></template>
    <template v-if="visible" #item="{ item, index }">
      <ListItem><input :aria-label="item.title" :value="`${index}:${item.title}:${label}`" /></ListItem>
    </template>
  </List>
</template>
