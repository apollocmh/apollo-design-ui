<script setup lang="ts">
import { ref } from 'vue';
import { TreeSelectTree } from '../../../tree/Tree';
import { TreeSelect } from '../../index';
import type { TreeSelectDataNode, TreeSelectRef, TreeSelectValue } from '../../interface';

const controls = { TreeSelect, TreeSelectTree };
const instance = ref<TreeSelectRef | null>(null);
const privateInstance = ref<InstanceType<typeof TreeSelectTree> | null>(null);
const value = ref<TreeSelectValue>('leaf');
const search = ref('');
const open = ref(true);
const expanded = ref<(string | number)[]>(['parent']);
const loaded = ref<(string | number)[]>([]);
const data: TreeSelectDataNode[] = [
  { value: 'parent', title: 'Parent', children: [{ value: 'leaf', title: 'Leaf' }] },
];
const observed = ref<string | number | undefined>();
const load = async (node: TreeSelectDataNode) => {
  observed.value = node.value;
};
const focus = () => {
  instance.value?.focus({ preventScroll: true });
  instance.value?.scrollTo({ key: 'leaf', align: 'top', offset: 0, autoExpand: true });
  privateInstance.value?.focus();
  privateInstance.value?.scrollTo({ key: 'leaf', align: 'bottom' });
};
</script>

<template>
  <controls.TreeSelect
    ref="instance"
    v-model:value="value"
    v-model:search-value="search"
    v-model:open="open"
    v-model:tree-expanded-keys="expanded"
    v-model:tree-loaded-keys="loaded"
    :tree-data="data"
    :show-search="{ filterTreeNode: (input, node) => String(node.title).includes(input) }"
    :load-data="load"
    aria-label="TreeSelect contract"
    @change="(next, labels, info) => { value = next; observed = info.triggerValue; labels?.join(','); }"
    @select="(next, node) => { observed = next; node?.title; }"
    @input-key-down="event => event.key"
    @tree-load="keys => keys.includes('parent')"
  >
    <template #treeTitleRender="{ node }"><strong>{{ node.title }}</strong></template>
    <template #switcherIcon="{ node, data: item }"><i>{{ node.expanded }}{{ item.title }}</i></template>
    <template #popupRender="{ menu }"><component :is="menu" /></template>
  </controls.TreeSelect>
  <controls.TreeSelectTree ref="privateInstance" list-id="native-private-tree" :tree-data="data" :field-names="{ key: 'value' }" />
  <button type="button" @click="focus">Focus tree select</button>
</template>
