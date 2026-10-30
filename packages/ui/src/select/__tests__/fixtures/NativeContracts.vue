<script setup lang="ts">
import { ref } from 'vue';
import { Select, SelectOptGroup, SelectOption, SelectPurePanel } from '../../index';
import type { SelectRef, SelectValue } from '../../interface';

const controls = { Select, SelectPurePanel };
const value = ref<SelectValue>();
const search = ref('');
const open = ref(false);
const select = ref<InstanceType<typeof Select> | null>(null);
const panel = ref<InstanceType<typeof SelectPurePanel> | null>(null);
function inspect() {
  const handle: SelectRef | null = select.value;
  const panelHandle: SelectRef | null = panel.value;
  handle?.focus({ preventScroll: true });
  panelHandle?.scrollTo({ key: 'a', align: 'bottom' });
  const native: HTMLElement | null = handle?.nativeElement ?? null;
  // @ts-expect-error The native root is an actual HTMLElement.
  native?.$el;
}
</script>
<template>
  <controls.Select ref="select" v-model:value="value" v-model:search-value="search" v-model:open="open" :show-search="{ optionFilterProp: 'label', autoClearSearchValue: true }" @select="(selected, option) => [selected, option.value]" @input-key-down="event => event.key" @search="text => text.toUpperCase()" aria-label="Native select">
    <SelectOptGroup label="Group"><SelectOption value="a">Apple</SelectOption></SelectOptGroup>
    <template #suffixIcon="{ focused, open: expanded, searchValue }">{{ focused }} {{ expanded }} {{ searchValue }}</template>
    <template #optionRender="{ option, index }">{{ index }} {{ option.value }}</template>
    <template #popupRender="{ menu }"><component :is="() => menu" /></template>
    <template #maxTagPlaceholder="{ omittedValues }">{{ omittedValues.length }}</template>
  </controls.Select>
  <controls.SelectPurePanel ref="panel" :options="[{value: 'a', label: 'Apple'}]"><template #optionRender="{ option }">{{ option.value }}</template></controls.SelectPurePanel>
  <button type="button" @click="inspect">Focus</button>
</template>
