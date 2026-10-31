<script setup lang="ts">
import { defineComponent, h, ref } from 'vue';
import { VirtualList, type VirtualListExposed } from '../../index';

interface Row {
  id: string;
  label: string;
}
const items = ref<Row[]>(
  Array.from({ length: 120 }, (_, index) => ({ id: `row-${index}`, label: `Row ${index}` })),
);
const list = ref<VirtualListExposed | null>(null);
const virtual = ref(true);
const rtl = ref(false);
const width = ref(600);
const alternate = ref(false);
const section = ref(false);
const alive = ref(true);
const scrollEvents = ref(0);
const positionEvents = ref(0);
const key = (item: Row) => item.id;
const alternativeKey = (item: Row) => `alternate:${item.id}`;
const Holder = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h(section.value ? 'section' : 'div', attrs, slots.default?.());
  },
});
function nativeScroll(event: Event) {
  if (event.target instanceof HTMLElement) scrollEvents.value++;
}
function reorder() {
  items.value = [items.value[2], items.value[1], items.value[0], ...items.value.slice(3)].filter(
    (item) => item !== undefined,
  );
}
</script>
<template>
  <main style="width: 320px; margin: 30px">
    <div style="display: flex; flex-wrap: wrap; gap: 4px">
      <button data-action="virtual" type="button" @click="virtual = !virtual">Toggle virtual</button>
      <button data-action="rtl" type="button" @click="rtl = !rtl">Toggle RTL</button>
      <button data-action="reorder" type="button" @click="reorder">Reorder</button>
      <button data-action="narrow" type="button" @click="width = width === 600 ? 200 : 600">Toggle width</button>
      <button data-action="key" type="button" @click="alternate = !alternate">Toggle key</button>
      <button data-action="holder" type="button" @click="section = !section">Toggle holder root</button>
      <button data-action="scroll" type="button" @click="list?.scrollTo({ key: alternate ? 'alternate:row-50' : 'row-50', align: 'top' })">Row 50</button>
      <button data-action="left" type="button" @click="list?.scrollTo({ left: 80 })">Inline offset 80</button>
      <button data-action="shrink" type="button" @click="items = items.slice(0, 3)">Shrink data</button>
      <button data-action="unmount" type="button" @click="alive = false">Unmount</button>
    </div>
    <VirtualList v-if="alive" ref="list" data-case="main" :data="items" :item-key="alternate ? alternativeKey : key"
      :virtual="virtual" :direction="rtl ? 'rtl' : 'ltr'" :scroll-width="width" :height="160" :item-height="32"
      :component="Holder" id="native-list" role="listbox" tabindex="0" aria-label="Native rows"
      :inner-props="{ class: 'custom-inner', style: { color: 'rgb(1, 2, 3)' }, 'data-inner': 'yes' }"
      @scroll="nativeScroll" @virtual-scroll="positionEvents++">
      <template #default="{ item, index, style, offsetX }">
        <input class="native-row" :data-row="item.id" :data-index="index" :data-offset="offsetX" :aria-label="item.label"
          :style="[style, { height: '32px', boxSizing: 'border-box', padding: '0', border: '0', flexShrink: 0 }]" />
      </template>
      <template #extra="{ start, end, getSize }">
        <span data-extra :data-first-bottom="getSize(alternate ? 'alternate:row-0' : 'row-0').bottom"
          :data-start="start" :data-end="end" aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden" />
      </template>
    </VirtualList>
    <output data-events>{{ scrollEvents }}:{{ positionEvents }}</output>
    <output data-state>{{ virtual }}:{{ rtl }}:{{ alternate }}:{{ width }}:{{ list?.getScrollInfo().x }}:{{ list?.getScrollInfo().y }}</output>
    <div style="height: 1600px" />
  </main>
</template>
