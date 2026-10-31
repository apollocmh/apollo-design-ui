<script setup lang="ts">
import { ref } from 'vue';
import { Filler, VirtualList, type VirtualListExposed } from '../../index';

interface Row {
  id: number;
  title: string;
  metadata: { value: number };
}
const rows: Row[] = [{ id: 1, title: 'One', metadata: { value: 1 } }];
const list = ref<VirtualListExposed | null>(null);
const visible = (_visible: Row[], _full: Row[]) => {};
const scroll = (event: Event) => {
  if (event.target instanceof HTMLElement) event.target.scrollTop;
};
const position = () =>
  list.value?.scrollTo({ key: 1, align: 'top', offset: ({ getSize }) => getSize(1).top });
</script>
<template>
  <VirtualList ref="list" :data="rows" item-key="id" :height="120" :item-height="20" id="typed-list"
    role="listbox" tabindex="0" aria-label="Rows" @visible-change="visible" @scroll="scroll">
    <template #default="{ item, index, style, offsetX }">
      <div :style="style">{{ item.title.toUpperCase() }} {{ index.toFixed() }} {{ offsetX.toFixed() }}
        <!-- @vue-expect-error The actual item has no missing field. -->
        {{ item.missing }}
        <!-- @vue-expect-error Title is a string in the native scoped slot. -->
        {{ item.title.toFixed() }}
      </div>
    </template>
    <template #extra="{ start, end, getSize, virtual }"><span>{{ start }}:{{ end }}:{{ getSize(1).bottom }}:{{ virtual }}</span></template>
  </VirtualList>
  <VirtualList :data="[1, 2]" :item-key="item => item"><template #default="{ item }"><div>{{ item.toFixed() }}</div></template></VirtualList>
  <!-- @vue-expect-error A field containing an object is not an item key. -->
  <VirtualList :data="rows" item-key="metadata" />
  <Filler :offset-y="0" :height="20" :inner-props="{ style: { color: undefined } }"><div>Native filler</div></Filler>
  <button type="button" @click="position">Scroll</button>
</template>
