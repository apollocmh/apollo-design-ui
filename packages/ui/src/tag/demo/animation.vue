<script setup lang="ts">
import { Button, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const visible = ref(true);
</script>

<template>
  <Tag v-if="visible" closable :style="{ marginInlineEnd: '8px' }" @close="visible = false"
    >Tag 1</Tag
  >
  <Button @click="visible = true">Reset</Button>
</template>
