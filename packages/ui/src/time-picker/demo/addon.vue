<script setup lang="ts">
// The native extraFooter slot can close the controlled popup.
import { Button, TimePicker } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
</script>

<template>
  <TimePicker v-model:open="open">
    <template #extraFooter>
      <Button size="small" type="primary" @click="open = false">OK</Button>
    </template>
  </TimePicker>
</template>
