<script setup lang="ts">
import type { TimelineItemType } from '@apollo-design/ui';
import { Button, ConfigProvider, Timeline } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);

const items: TimelineItemType[] = [
  { content: 'Create a services site 2015-09-01' },
  { content: 'Solve initial network problems 2015-09-01', color: 'blue' },
  { content: 'Technical testing 2015-09-01', color: 'green' },
  { content: 'Network problems being solved 2015-09-01' },
];
</script>

<template>
  <Button style="margin-bottom: 16px" @click="custom = !custom">Toggle component tokens</Button>
  <ConfigProvider :theme="{ components: { Timeline: custom ? {
    tailColor: '#91caff', tailWidth: 3, dotSize: 14, dotBg: '#e6f4ff',
    dotBorderWidth: 3, itemPaddingBottom: 28,
  } : {} } }">
    <Timeline :items="items" />
  </ConfigProvider>
</template>
