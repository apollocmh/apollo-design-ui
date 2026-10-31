<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import type { TriggerAlign } from '../../../_internal/trigger';
import { Tour, TourPurePanel } from '../../index';
import type { TourStepProps } from '../../interface';

const open = ref(false);
const current = ref(0);
const target = shallowRef<HTMLButtonElement | null>(null);
const steps: TourStepProps[] = [{ title: 'Typed step', target: () => target.value }];
const align = (_element: HTMLElement, _align: TriggerAlign) => {};
</script>

<template>
  <button ref="target" type="button" @click="open = true">Start</button>
  <Tour v-model:open="open" v-model:current="current" :steps="steps" @popup-align="align">
    <template #title="{ step, current, total }"><strong>{{ step.title }} {{ current.toFixed() }} / {{ total }}</strong></template>
    <template #actions="{ originNode }"><component :is="originNode" /></template>
  </Tour>
  <TourPurePanel :current="current" :total="3">
    <template #indicators="{ current, total }">{{ current + 1 }}/{{ total }}</template>
    <template #actions="{ originNode }"><component :is="originNode" /></template>
  </TourPurePanel>
  <Tour :steps="steps">
    <template #title="{ step, current }">
      <!-- @vue-expect-error current is a numeric slot value -->
      <span :title="current.toUpperCase()" />
      <!-- @vue-expect-error step is the actual TourStepProps data -->
      <span :title="step.missing" />
    </template>
  </Tour>
</template>
