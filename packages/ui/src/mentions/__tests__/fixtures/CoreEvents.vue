<script setup lang="ts">
import { ref } from 'vue';
import { Mentions, type MentionsOptionProps } from '../../../index';

defineProps<{
  changeOnce: (value: string) => void;
  selectOnce: (option: MentionsOptionProps, prefix: string) => void;
  searchOnce: (text: string, prefix: string) => void;
}>();
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const exactString = <T>(value: T, ..._check: Equal<T, string> extends true ? [] : [never]) => value;
const exactOption = <T>(
  value: T,
  ..._check: Equal<T, MentionsOptionProps> extends true ? [] : [never]
) => value;
const value = ref('');
const options = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'beta', label: 'Beta' },
];
</script>

<template>
  <Mentions v-model:value="value" :options="options" allow-clear aria-label="Mention events"
    @change.once="text => changeOnce(exactString(text))"
    @select.once="(option, prefix) => selectOnce(exactOption(option), exactString(prefix))"
    @search.once="(text, prefix) => searchOnce(exactString(text), exactString(prefix))" />
  <output data-core-event-value>{{ value }}</output>
</template>
