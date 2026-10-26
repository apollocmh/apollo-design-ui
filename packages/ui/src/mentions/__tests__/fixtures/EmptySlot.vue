<script setup lang="ts">
import { ref } from 'vue';
import { ConfigProvider, Mentions } from '../../../index';

const present = ref(true);
const blank = ref(false);
const text = ref('Current empty message');
</script>
<template>
  <ConfigProvider :components="{ mentions: { notFoundContent: 'Configured empty' } }">
    <Mentions :options="[]" not-found-content="Prop fallback" aria-label="Typed empty mentions">
      <template v-if="present" #notFoundContent><span v-if="!blank">{{ text }}</span></template>
    </Mentions>
  </ConfigProvider>
  <Mentions :not-found-content="false" aria-label="Empty data" />
  <!-- @vue-expect-error Render functions belong in the native content slot. -->
  <Mentions :not-found-content="() => 'wrong channel'" />
  <Mentions>
    <!-- @vue-expect-error Unknown empty slots are rejected. -->
    <template #unknownEmpty>Unsupported</template>
  </Mentions>
</template>
