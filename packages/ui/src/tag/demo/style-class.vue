<script setup lang="ts">
import { CheckCircleOutlined } from '@apollo-design/icons';
import { Tag, type TagSemanticClassNames, type TagSemanticStyles } from '@apollo-design/ui';

const classNames: TagSemanticClassNames = {
  root: 'demo-tag-root',
  icon: 'demo-tag-icon',
  content: 'demo-tag-content',
  close: 'demo-tag-close',
};
const styles: TagSemanticStyles = {
  root: { padding: '2px 6px', borderRadius: '4px' },
  icon: { fontSize: '14px' },
  content: { fontWeight: 600 },
  close: { marginInlineStart: '8px' },
};
</script>
<template>
  <Tag :class-names="classNames" :styles="styles" :style="[{ paddingInline: '10px' }]" closable>
    <template #icon><CheckCircleOutlined aria-hidden="true" /></template>
    Tag with semantic slots
  </Tag>
</template>
<style scoped>
.demo-tag-root { border-color: var(--apollo-color-primary); }
</style>
