<script setup lang="ts">
import { Mentions } from '@apollo-design/ui';
import { ref } from 'vue';
const value = ref('');
const selections = ref<string[]>([]);
const searches = ref(0);
const keys = ref<{ key: string; which: number; isComposing: boolean }[]>([]);
const options = [{ value: 'alpha', label: 'Alpha' }, { value: 'disabled', label: 'Disabled', disabled: true }, { value: 'beta', label: 'Beta' }];
</script>
<template>
  <Mentions v-model:value="value" allow-clear aria-label="Standard mention keyboard" :options="options"
    @search="searches++" @select="option => selections.push(option.value)"
    @keydown="event => keys.push({ key: event.key, which: event.which, isComposing: event.isComposing })" />
  <output id="mention-keyboard">{{ JSON.stringify({ value, selections, searches, keys }) }}</output>
</template>
