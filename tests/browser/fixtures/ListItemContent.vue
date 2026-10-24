<script setup lang="ts">
import { List, ListItem, ListItemMeta, type ListItemRef } from '@apollo-design/ui';
import { h, ref } from 'vue';

const visible = ref(false);
const empty = ref(false);
const label = ref('first');
const grid = ref(false);
const vertical = ref(true);
const actions = ref(['edit', 'more']);
const itemRef = ref<ListItemRef>();
const reverse = () => {
  actions.value = [...actions.value].reverse();
};
</script>

<template>
  <button @click="visible = !visible">Toggle child slots</button>
  <button @click="empty = !empty">Toggle child empty</button>
  <button @click="label = label === 'first' ? 'second' : 'first'">Update child label</button>
  <button @click="reverse">Reverse actions</button>
  <button @click="grid = !grid">Toggle grid</button>
  <button @click="vertical = !vertical">Toggle vertical</button>
  <output>{{ itemRef?.nativeElement?.tagName }}:{{ itemRef?.nativeElement?.classList.contains('apollo-col') }}</output>
  <List :grid="grid ? { column: 2 } : undefined" :item-layout="vertical ? 'vertical' : 'horizontal'">
    <ListItem ref="itemRef" extra="prop extra" :actions="[h('button', 'prop action')]">
      <ListItemMeta avatar="prop avatar" title="prop title" description="prop description">
        <template v-if="visible" #avatar><span v-if="!empty">avatar:{{ label }}</span></template>
        <template v-if="visible" #title><a v-if="!empty" href="#title">{{ label }}</a></template>
        <template v-if="visible" #description><p v-if="!empty">description:{{ label }}</p></template>
      </ListItemMeta>
      <template v-if="visible" #extra><aside v-if="!empty">extra:{{ label }}</aside></template>
      <template v-if="visible" #actions>
        <template v-if="!empty">
          <button v-for="action in actions" :key="action" :data-action="action">{{ action }}:{{ label }}</button>
        </template>
      </template>
    </ListItem>
  </List>
</template>
