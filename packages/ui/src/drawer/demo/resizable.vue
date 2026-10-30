<script setup lang="ts">
import { Button, Drawer } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const size = ref(378);
const dragging = ref(false);
function start(value: number) {
  dragging.value = true;
  size.value = value;
}
function end(value: number) {
  dragging.value = false;
  size.value = value;
}
</script>

<template>
  <Button type="primary" @click="open = true">Open resizable drawer</Button>
  <Drawer
    title="Resizable Drawer"
    resizable
    :max-size="600"
    :open="open"
    @close="open = false"
    @resize="value => size = value"
    @resize-start="start"
    @resize-end="end"
  >
    <p>Drag the edge to resize (up to 600px).</p>
    <p aria-live="polite">{{ dragging ? 'Resizing' : 'Current size' }}: {{ Math.round(size) }}px</p>
  </Drawer>
</template>
