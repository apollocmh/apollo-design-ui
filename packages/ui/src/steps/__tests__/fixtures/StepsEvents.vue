<script setup lang="ts">
import { ref } from 'vue';
import { Steps } from '../../index';

const current = ref(0);
const received = ref<number[]>([]);
const items = [{ title: 'Alpha' }, { title: 'Beta' }];
const change = (value: number) => received.value.push(value);
const listeners = { change: [change, (value: number) => value.toFixed()] };
</script>

<template>
  <Steps :items="items" :current="current" @change="current = $event" @change.once="change" v-on="listeners" />
  <output>{{ received.join(',') }}</output>
</template>
