<script setup lang="ts">
import { Empty } from '@apollo-design/ui';
import { ref } from 'vue';

const draft = ref('');
</script>

<template>
  <Empty description="Custom image">
    <template #image>
      <svg width="64" height="41" viewBox="0 0 64 41" role="img" aria-label="Custom diagram">
        <ellipse fill="var(--apollo-color-fill-tertiary)" cx="32" cy="33" rx="32" ry="7" />
        <text x="32" y="26" text-anchor="middle" font-size="12" fill="var(--apollo-color-text)">custom</text>
      </svg>
      <label class="empty-draft">
        Draft name
        <input v-model="draft" placeholder="Keep editing while configuration changes" />
      </label>
      <span>Complete image content</span>
    </template>
  </Empty>
</template>

<style scoped>
.empty-draft { display: block; margin-block: 8px; }
.empty-draft input { max-width: 100%; }
</style>
