<script setup lang="ts">
import { ref } from 'vue';
import type { SelectValue } from '../../../select/interface';
import { AutoComplete } from '../../index';
import type { AutoCompleteRef } from '../../interface';

const controls = { AutoComplete };
const value = ref<SelectValue>('');
const search = ref('');
const open = ref(false);
const autocomplete = ref<InstanceType<typeof AutoComplete> | null>(null);
function focus() {
  const handle: AutoCompleteRef | null = autocomplete.value;
  handle?.focus({ preventScroll: true });
  handle?.scrollTo({ key: 'a', align: 'bottom' });
  handle?.scrollTo({ top: 0 });
  const root: HTMLElement | null = handle?.nativeElement ?? null;
  // @ts-expect-error The public native element is a real DOM node.
  root?.$el;
}
</script>
<template>
  <controls.AutoComplete ref="autocomplete" v-model:value="value" v-model:search-value="search" v-model:open="open" backfill :options="[{value:'a', label:'Alpha'}]" :filter-option="(text, option) => String(option.value).includes(text)" @search="text => text.toUpperCase()" @select="(selected, option) => [String(selected), option.label]" @input-key-down="event => event.key" aria-label="Typed autocomplete">
    <template #suffixIcon="{ focused, open: expanded }">{{ focused }} {{ expanded }}</template>
    <template #searchIcon>0</template>
    <template #optionRender="{ option, index }">{{ index }} {{ option.value }}</template>
    <template #popupRender="{ menu }"><component :is="() => menu" /></template>
  </controls.AutoComplete>
  <button type="button" @click="focus">Focus</button>
</template>
