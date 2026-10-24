<script setup lang="ts">
import { Avatar, List, ListItem, Steps, useBreakpoint } from '@apollo-design/ui';
import { ref } from 'vue';

const enabled = ref(false);
const screens = useBreakpoint(() => enabled.value, null);
const rows = ['Alpha', 'Beta'];
</script>

<template>
  <button @click="enabled = !enabled">Toggle responsive updates</button>
  <Steps data-breakpoint-steps :responsive="enabled" :items="[{ title: 'Alpha' }, { title: 'Beta' }]" />
  <Avatar data-breakpoint-avatar :size="enabled ? { xs: 24, sm: 48 } : 32">A</Avatar>
  <List data-breakpoint-list :data-source="rows" :grid="enabled ? { xs: 2, sm: 3 } : { column: 1 }">
    <template #item="{ item }"><ListItem><input :aria-label="`Breakpoint ${item}`" /></ListItem></template>
  </List>
  <output id="breakpoint-state">{{ screens === null ? 'paused' : screens.xs ? 'xs' : 'wide' }}</output>
</template>
