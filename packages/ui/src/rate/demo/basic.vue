<script setup lang="ts">
import { Rate } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref(0);
const keys = ref(0);
</script>

<template>
  <div>
    <Rate v-model:value="value" aria-label="Rating" @keydown="keys++" />
    <output>{{ value }} · Keyboard events: {{ keys }}</output>
  </div>
</template>
