<script setup lang="ts">
import { Flex, type FlexProps, type FlexRef, type FlexSlot } from '@apollo-design/ui';
import { defineComponent, h, ref } from 'vue';

const owner = ref<FlexRef | null>(null);
const layout: FlexProps = {
  orientation: 'vertical',
  wrap: true,
  align: 'stretch',
  justify: 'space-between',
  gap: 10.5,
  flex: 0,
};
const complete: FlexSlot = () => [0, 'complete', h('strong', 'content')];
const CustomRoot = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('section', attrs, slots.default?.());
  },
});
const onClick = (event: MouseEvent) => {
  event.preventDefault();
};
void complete;
</script>

<template>
  <Flex ref="owner" v-bind="layout" :component="CustomRoot" :class="['current', { active: true }]" :style="['padding: 3px', { margin: '4px' }]" aria-label="Business layout" @click="onClick">
    <strong>Complete</strong> text {{ 0 }}
  </Flex>
</template>
