<script setup lang="ts">
import { ref } from 'vue';
import RadioGroup from '../../../radio/Group';
import type { RadioValue } from '../../../radio/interface';
import Checkbox from '../../Checkbox';
import Group from '../../Group';
import type { CheckboxGroupRef, CheckboxRef, CheckboxValueType } from '../../interface';

const accepted = ref(false);
const checked = ref(false);
const values = ref<CheckboxValueType[]>(['a']);
const radio = ref<RadioValue>('a');
const checkboxRef = ref<CheckboxRef | null>(null);
const groupRef = ref<CheckboxGroupRef | null>(null);
const shown = ref(true);
const changes = ref(0);
</script>

<template>
  <button id="accept" @click="accepted = true">accept</button>
  <button id="unmount" @click="shown = false">unmount</button>
  <form v-if="shown">
    <Checkbox id="checkbox" ref="checkboxRef" :checked="checked" indeterminate @update:checked="accepted && (checked = $event)" @change="changes += 1">Checkbox</Checkbox>
    <Group ref="groupRef" data-case="checkbox-group" name="choices" :value="values" :options="['a', 'b']" @update:value="accepted && (values = $event)" />
    <RadioGroup data-case="radio-group" name="native-radio" :value="radio" :options="['a', 'b']" @update:value="accepted && (radio = $event)" />
  </form>
  <output id="state" :data-checked="checked" :data-changes="changes" :data-ref="Boolean(checkboxRef?.input)" :data-group-ref="Boolean(groupRef?.nativeElement)" />
</template>
