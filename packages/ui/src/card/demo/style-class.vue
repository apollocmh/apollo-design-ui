<script setup lang="ts">
// 语义化 classNames / styles：root / header / body / title / extra / actions。
import { Card } from '@apollo-design/ui';

const classNames = {
  root: 'demo-card-style-root',
  header: 'demo-card-style-header',
  body: 'demo-card-style-body',
  title: 'demo-card-style-title',
  extra: 'demo-card-style-extra',
  actions: 'demo-card-style-actions',
};

const styles = {
  body: {
    background:
      'linear-gradient(180deg, var(--apollo-color-primary-bg) 0%, var(--apollo-color-bg-container) 100%)',
  },
  title: { color: 'var(--apollo-color-primary-text)' },
  extra: { fontSize: '14px' },
};

const actions = ['Edit', 'More'];
</script>

<template>
  <Card
    title="Semantic styles"
    extra="Extra"
    hoverable
    :actions="actions"
    :class-names="classNames"
    :styles="styles"
  >
    <p>Card content</p>
    <p>Use semantic classNames and styles to customize each part of the card.</p>
  </Card>
</template>

<style>
.demo-card-style-root {
  width: 360px;
  max-width: 100%;
  border: 1px solid var(--apollo-color-border);
}

.demo-card-style-header {
  letter-spacing: 0.01em;
}

.demo-card-style-actions {
  color: var(--apollo-color-primary);
}
</style>
