<script setup lang="ts">
import { Mentions, type MentionsOptionProps } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('');
const changes = ref<string[]>([]);
const searches = ref<string[]>([]);
const selections = ref<string[]>([]);
const once = ref({ change: 0, search: 0, select: 0 });
const inputs = ref(0);
const models = ref(0);
const phase = ref(false);
const old = ref(0);
const current = ref(0);
const first = (text: string) => {
  old.value++;
  changes.value.push(text);
};
const second = (text: string) => {
  current.value++;
  changes.value.push(text);
};
const select = (option: MentionsOptionProps, prefix: string) =>
  selections.value.push(prefix + option.value);
</script>
<template>
  <button @mousedown.prevent @click="phase = !phase">Replace change listener</button>
  <Mentions v-model:value="value" :options="[{ value: 'alpha', label: 'Alpha' }, { value: 'beta', label: 'Beta' }]"
    allow-clear aria-label="Core mention events" v-on="{ change: phase ? [second] : [first] }"
    @input="inputs++" @update:value="models++" @change.once="once.change++"
    @search="(text, prefix) => searches.push(prefix + text)" @search.once="once.search++"
    @select="select" @select.once="once.select++" />
  <output id="mention-events">{{ JSON.stringify({ value, changes, searches, selections, once, inputs, models, old, current }) }}</output>
</template>
