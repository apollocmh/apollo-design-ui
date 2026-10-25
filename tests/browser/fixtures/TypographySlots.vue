<script setup lang="ts">
import { Link, Paragraph, Text, Title, Typography } from '@apollo-design/ui';
import { defineComponent, h, ref } from 'vue';
import EditableDemo from '../../../packages/ui/src/typography/demo/editable.vue';

const text = ref('First parent-render text');
const revision = ref(0);
const updateText = () => {
  revision.value++;
  text.value = `Current parent-render text ${revision.value}`;
};
const CurrentSlots = defineComponent(() => () => {
  // The slot captures a plain value from this parent render, rather than reading the ref itself.
  const current = text.value;
  const longCurrent = Array(12).fill(current).join(' ');
  return h('div', [
    h('section', { 'data-typography-entry': 'Text' }, [h(Text, { copyable: true, editable: true, 'aria-label': 'Text current editor' }, { default: () => current })]),
    h('section', { 'data-typography-entry': 'Title' }, [h(Title, { level: 2, copyable: true, editable: true, 'aria-label': 'Title current editor' }, { default: () => current })]),
    h('section', { 'data-typography-entry': 'Paragraph' }, [h(Paragraph, { copyable: true, editable: true, 'aria-label': 'Paragraph current editor' }, { default: () => current })]),
    h('section', { 'data-typography-entry': 'Link' }, [h(Link, { href: '#typography-slot-target', copyable: true, editable: true, 'aria-label': 'Link current editor' }, { default: () => current })]),
    h('section', { 'data-typography-entry': 'Typography' }, [h(Typography, {}, { default: () => current })]),
    h('section', { 'data-typography-ellipsis': '' }, [h(Text, { ellipsis: true, style: { display: 'inline-block', width: '120px' } }, { default: () => current })]),
    h('section', { 'data-typography-js-ellipsis': '' }, [h(Paragraph, { ellipsis: { rows: 2, expandable: 'collapsible' }, style: { width: '220px', lineHeight: '22px' } }, { default: () => longCurrent })]),
    h('section', { 'data-typography-rich': '' }, [h(Paragraph, {}, { default: () => [
      h('span', { key: 'label', 'data-typography-rich-label': '' }, current),
      h('input', { key: 'draft', 'aria-label': 'Typography rich draft' }),
    ] })]),
  ]);
});
</script>

<template>
  <button type="button" @mousedown.prevent @click="updateText">Update all typography text</button>
  <CurrentSlots />
  <section data-typography-editable-demo>
    <EditableDemo />
  </section>
</template>
