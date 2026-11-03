<script setup lang="ts">
import { BorderBeam } from '@apollo-design/ui';
import { ref } from 'vue';

const active = ref(false);
</script>

<template>
  <BorderBeam :styles="{ effect: { opacity: active ? 1 : 0 } }">
    <div
      style="position: relative; border: 1px solid var(--apollo-color-border); border-radius: 8px; padding: 24px"
      tabindex="0"
      aria-label="Hover or focus to preview the border beam"
      @mouseenter="active = true"
      @mouseleave="active = false"
      @focus="active = true"
      @blur="active = false"
    >
      Hover or focus me
    </div>
  </BorderBeam>
</template>
