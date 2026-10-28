<script setup lang="ts">
import { isEmptyVNode } from '@apollo-design/utils';
import { ref, useAttrs, type VNodeChild } from 'vue';
import BadgeIndicator from './BadgeIndicator.vue';
import type { BadgeProps, BadgeRef, BadgeSlots } from './interface';

defineOptions({ name: 'ABadge', inheritAttrs: false });
const props = withDefaults(defineProps<BadgeProps>(), {
  count: null,
  text: undefined,
  title: undefined,
  overflowCount: 99,
  size: 'medium',
});
const slots = defineSlots<BadgeSlots>();
const attrs = useAttrs();
const indicator = ref<BadgeRef | null>(null);
defineExpose({
  get nativeElement() {
    return indicator.value?.nativeElement ?? null;
  },
});

// Normalize only emptiness. Rich template content never enters digit/overflow parsing.
const slotContent = (node: VNodeChild): VNodeChild => (isEmptyVNode(node) ? null : node);
</script>

<template>
  <BadgeIndicator
    ref="indicator"
    v-bind="{ ...attrs, ...props }"
    :count="slots.count ? slotContent(slots.count()) : props.count"
    :text="slots.text ? slotContent(slots.text()) : props.text"
    :custom-count="!!slots.count"
    :has-wrapper="!!slots.default"
  >
    <template v-if="slots.default" #default><slot /></template>
  </BadgeIndicator>
</template>
