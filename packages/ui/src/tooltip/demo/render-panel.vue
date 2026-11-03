<script setup lang="ts">
import { Button, TooltipPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(false);
const empty = ref(false);
const count = ref(0);
</script>

<template>
  <div style="font-family: sans-serif">
    <p style="display: flex; flex-wrap: wrap; gap: 8px">
      <Button @click="show = !show">Toggle tooltip title</Button>
      <Button @click="empty = !empty">Empty tooltip title</Button>
      <Button @click="count++">Update tooltip title</Button>
    </p>
    <TooltipPurePanel title="Hello, Pink Pure Panel!" color="pink" />
    <TooltipPurePanel title="Hello, Customize Color Pure Panel!" color="#f50" />
    <TooltipPurePanel data-native-tooltip-panel title="Hello, Pure Panel!" placement="bottomLeft" style="width: 200px">
      <template v-if="show" #title><strong v-if="!empty">Native tooltip {{ count }}</strong></template>
    </TooltipPurePanel>
  </div>
</template>
