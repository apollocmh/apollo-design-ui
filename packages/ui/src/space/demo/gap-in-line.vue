<script setup lang="ts">
import { Space } from '@apollo-design/ui';
import { ref } from 'vue';

const singleCol = ref(false);
</script>
<template>
  <label><input v-model="singleCol" type="checkbox" /> Single column</label>
  <div style="max-width: 100%; overflow: auto; margin-top: 12px"><Space :style="{ width: singleCol ? '307px' : '310px' }" :size="[8, 8]" wrap><div v-for="i in 4" :key="i" class="gap-box">{{ i }}</div></Space></div>
</template>
<style scoped>.gap-box { width: 150px; height: 100px; display: grid; place-items: center; color: var(--apollo-color-text); background: var(--apollo-color-fill-secondary); }</style>
