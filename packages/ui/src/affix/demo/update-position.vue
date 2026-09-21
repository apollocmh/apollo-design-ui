<script setup lang="ts">
import { ref } from 'vue';
import { Affix } from '../../index';
import { Button } from '../../index';

const affixRef = ref<{ updatePosition: () => void } | null>(null);
</script>

<template>
  <Affix ref="affixRef" :offset-top="60">
    <Button @click="affixRef?.updatePosition()">手动重新测量</Button>
  </Affix>
</template>
