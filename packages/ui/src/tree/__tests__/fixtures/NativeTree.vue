<script setup lang="ts">
import { ref } from 'vue';
import DirectoryTree from '../../DirectoryTree';
import type { TreeKey, TreeRef } from '../../interface';
import Tree from '../../Tree';

interface Entry {
  id: string;
  name: string;
}
const data: Entry[] = [{ id: 'one', name: 'One' }];
const active = ref<TreeKey | null>(null);
const expanded = ref<TreeKey[]>([]);
const selected = ref<TreeKey[]>([]);
const tree = ref<TreeRef<Entry> | null>(null);
const onMouse = (event: MouseEvent) => event.preventDefault();
const scroll = () => {
  tree.value?.focus();
  tree.value?.scrollTo({ key: 'one', autoExpand: true, align: 'top' });
};
</script>

<template>
  <button @click="scroll">Focus</button>
  <Tree ref="tree" v-model:active-key="active" v-model:expanded-keys="expanded" :tree-data="data" :field-names="{ key: 'id', title: 'name' }" @mouse-enter="onMouse">
    <template #title="{ node, data: raw }">{{ raw.name }} {{ node.key }}</template>
    <template #switcherLoadingIcon>Loading</template>
  </Tree>
  <DirectoryTree v-model:selected-keys="selected" :tree-data="data" :field-names="{ key: 'id', title: 'name' }" />
</template>
