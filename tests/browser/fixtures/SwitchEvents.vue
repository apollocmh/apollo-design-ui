<script setup lang="ts">
import { Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref(false);
const disabled = ref(false);
const clicks = ref(0);
const changes = ref(0);
const captures = ref(0);
const once = ref(0);
const bubbles = ref(0);
const lastClick = ref('');
const lastChange = ref('');
const onClick = (event: MouseEvent) => {
  clicks.value++;
  lastClick.value = `${event instanceof MouseEvent}:${event.type}:${event.currentTarget instanceof HTMLButtonElement}:${event.defaultPrevented}`;
};
const onChange = (value: boolean, event: MouseEvent | KeyboardEvent) => {
  changes.value++;
  lastChange.value = `${value}:${event.type}`;
};
</script>

<template>
  <button @click="disabled = !disabled">Toggle Switch disabled</button>
  <section @click="bubbles++">
    <Switch v-model:checked="checked" :disabled="disabled" aria-label="Native switch"
      style="color:red" @click.stop.prevent="onClick" @click.once="once++"
      @click.capture="captures++" @change="onChange" />
  </section>
  <Switch aria-label="Uncontrolled switch" />
  <output id="switch-event-state">{{ JSON.stringify({ checked, clicks, changes, captures, once, bubbles, lastClick, lastChange }) }}</output>
</template>
