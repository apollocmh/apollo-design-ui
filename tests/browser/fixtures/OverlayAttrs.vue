<script setup lang="ts">
import { Popconfirm, PopconfirmPurePanel, Popover, PopoverPurePanel, TooltipPurePanel } from '@apollo-design/ui';
import { type ClassValue, computed, ref, type StyleValue } from 'vue';

const phase = ref(0);
const attrs = computed<{ class: ClassValue; style: StyleValue }>(() => ({
  class: ['native-attrs', { first: phase.value === 0, next: phase.value === 1 }],
  style: phase.value === 0
    ? 'max-width: 310px; padding-top: 9px; --native-phase: first'
    : phase.value === 1
      ? ['max-width: 340px; --native-phase: second', { paddingBottom: '10px' }]
      : undefined,
}));
const styles = { root: { minHeight: '70px', maxWidth: '220px' }, container: { borderRadius: '14px', paddingTop: '6px' }, arrow: { opacity: 0.4 } };
</script>

<template>
  <div>
    <button @click="phase = (phase + 1) % 3">Cycle native overlay attrs</button>
    <div style="display: flex; gap: 180px; margin: 160px 0">
      <Popover v-bind="attrs" open title="Popover" :styles="styles" :class-names="{ root: 'native-popover' }">
        <button data-native-popover-trigger>Popover target</button>
        <template #content><input aria-label="Attrs popup note" /></template>
      </Popover>
      <Popconfirm v-bind="attrs" open title="Confirm" :styles="styles" :class-names="{ root: 'native-confirm' }"><button data-native-confirm-trigger>Confirm target</button></Popconfirm>
    </div>
    <TooltipPurePanel v-bind="attrs" title="Tooltip panel" :styles="styles" :class-names="{ root: 'native-tooltip-panel' }" />
    <PopoverPurePanel v-bind="attrs" title="Popover panel" content="Content" :styles="styles" :class-names="{ root: 'native-popover-panel' }" />
    <PopconfirmPurePanel v-bind="attrs" title="Confirm panel" :styles="styles" :class-names="{ root: 'native-confirm-panel', container: 'native-confirm-container', arrow: 'native-confirm-arrow' }" />
  </div>
</template>
