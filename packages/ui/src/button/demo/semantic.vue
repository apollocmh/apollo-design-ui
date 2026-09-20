<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
import { Button } from '../../index';
</script>

<template>
  <Button
    type="primary"
    :icon="SearchOutlined"
    :class-names="{ root: 'demo-btn-root', icon: 'demo-btn-icon', content: 'demo-btn-content' }"
    :styles="{ root: { borderRadius: '16px' }, content: { letterSpacing: '2px' } }"
  >
    Semantic
  </Button>
</template>
