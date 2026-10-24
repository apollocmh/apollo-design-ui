<script setup lang="ts">
import { Button, ColorPicker, Rate } from '@apollo-design/ui';
import { ref } from 'vue';

const updated = ref(false);
const disabled = ref(false);
const rating = ref(0);
const mouse = ref(0);
const keys = ref(0);
const leaves = ref(0);
</script>

<template>
  <Button @click="updated = !updated">Update attrs</Button>
  <Button @click="disabled = !disabled">Disable rating</Button>
  <ColorPicker :id="updated ? 'after' : 'before'" :class="updated ? 'after' : 'before'"
    :aria-label="updated ? 'After color' : 'Before color'" @mousedown="mouse++" />
  <Rate v-model:value="rating" aria-label="Native rating" :disabled="disabled"
    @keydown="keys++" @mouseleave="leaves++" />
  <output id="native-state">{{ JSON.stringify({ rating, mouse, keys, leaves }) }}</output>
</template>
