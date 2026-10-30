<script setup lang="ts">
import { Fragment, h, ref, useTemplateRef } from 'vue';
import { Segmented } from '../../index';
import type {
  SegmentedOptions,
  SegmentedProps,
  SegmentedRef,
  SegmentedValue,
} from '../../interface';

const value = ref<SegmentedValue>(0);
const present = ref(true);
const control = useTemplateRef<SegmentedRef>('control');
const changed = ref<SegmentedValue[]>([]);
const options: SegmentedOptions = [
  { value: 0, icon: 0, label: ['Zero ', h('b', 'content')] },
  { value: 'one', label: h(Fragment, ['One ', h('i', 'content')]) },
];
const styles: NonNullable<SegmentedProps['styles']> = ({ props }) => ({
  label: { fontWeight: props.value === 0 ? 600 : 400 },
});
const change = (next: SegmentedValue) => changed.value.push(next);
defineExpose({
  value,
  present,
  changed,
  get element() {
    return control.value?.nativeElement;
  },
});
</script>
<template>
  <Segmented v-if="present" id="compiled-segmented" ref="control" v-model:value="value" :options="options" :styles="styles" @change="change" />
</template>
