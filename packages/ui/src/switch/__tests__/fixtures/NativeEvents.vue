<script setup lang="ts">
import { ref } from 'vue';
import { Switch } from '../../index';

const checked = ref(false);
const onMouse = (event: MouseEvent) => event.clientX;
const onChange = (value: boolean, event: MouseEvent | KeyboardEvent) => `${value}:${event.type}`;
</script>

<template>
  <Switch v-model:checked="checked" @click.stop.prevent="event => onMouse(event)" @change="onChange" />
</template>
