<script setup lang="ts">
import { Button, InputNumber, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const checked = ref(false);
const amount = ref<number | string | null>(1);
const disabled = ref(false);
const switchChanges = ref(0);
const numberChanges = ref(0);
const lastSwitch = ref('');
const lastNumber = ref('');
const clickPayload = ref('');
const onClick = (event: MouseEvent) => {
  clickPayload.value = event instanceof MouseEvent ? event.type : 'invalid';
};
const onSwitch = (value: boolean, event: MouseEvent | KeyboardEvent) => {
  switchChanges.value++;
  lastSwitch.value = `${value}:${event.type}`;
};
const onNumber = (value: number | string | null) => {
  numberChanges.value++;
  lastNumber.value = `${typeof value}:${value}`;
};
</script>

<template>
  <Button @click="disabled = !disabled">Toggle disabled</Button>
  <Switch v-model:checked="checked" :disabled="disabled" aria-label="Semantic switch"
    @change="onSwitch" @click="onClick" />
  <InputNumber v-model:value="amount" :disabled="disabled" aria-label="Semantic number" @change="onNumber" />
  <output id="event-state">{{ JSON.stringify({ checked, amount, switchChanges, numberChanges, lastSwitch, lastNumber, clickPayload }) }}</output>
</template>
