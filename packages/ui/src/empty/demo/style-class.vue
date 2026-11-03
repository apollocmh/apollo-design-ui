<script setup lang="ts">
import { Button, Checkbox, Empty, type EmptyProps } from '@apollo-design/ui';
import { ref } from 'vue';

const highlighted = ref(false);
const classNames = {
  root: 'demo-empty-root',
  image: 'demo-empty-image',
  description: 'demo-empty-description',
  footer: 'demo-empty-footer',
};
const styles: EmptyProps['styles'] = ({ props }) => ({
  root: {
    backgroundColor: 'var(--apollo-color-fill-alter)',
    color: 'var(--apollo-color-text)',
    padding: 'var(--apollo-padding)',
  },
  image: { opacity: 0.8 },
  description: { fontWeight: props.description === 'Highlighted description' ? 600 : 400 },
  footer: { paddingBlock: 'var(--apollo-padding-xs)' },
});
</script>

<template>
  <Checkbox v-model:checked="highlighted">Highlight description</Checkbox>
  <Empty
    :class-names="classNames"
    :styles="styles"
    :description="highlighted ? 'Highlighted description' : '带语义化类名与样式'"
  >
    <Button type="primary">Create</Button><span> — complete footer content</span>
  </Empty>
</template>
