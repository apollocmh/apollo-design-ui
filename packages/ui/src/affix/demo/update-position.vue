<script setup lang="ts">
import { ref } from 'vue';
import { Affix, type AffixRef, Button } from '../../index';

const affixRef = ref<AffixRef | null>(null);
</script>

<template>
  <div style="min-height: 760px; padding-top: 120px">
  <Affix ref="affixRef" :offset-top="60">
    <Button @click="affixRef?.updatePosition()">手动重新测量</Button>
  </Affix>
    <p style="margin-top: 24px">Scroll this preview to observe the fixed position.</p>
  </div>
</template>
