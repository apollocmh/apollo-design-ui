<script setup lang="ts">
import { ref } from 'vue';
import type { Rate } from '../../index';

const rate = ref<InstanceType<typeof Rate> | null>(null);
const value = ref(2);
const changed = ref(0);
const hover = ref<number>();
const focusType = ref('');
const blurType = ref('');

const focus = () => rate.value?.focus();
const blur = () => rate.value?.blur();
</script>

<template>
  <Rate
    ref="rate"
    v-model:value="value"
    aria-label="Rating contract"
    @change="changed = $event"
    @hover-change="hover = $event"
    @focus="focusType = $event.type"
    @blur="blurType = $event.type"
    #character="{ index, value: displayed, allowHalf, disabled, count, focused }"
  >
    {{ index + 1 }} / {{ count }}: {{ displayed }} {{ allowHalf }} {{ disabled }} {{ focused }}
  </Rate>
  <button type="button" @click="focus">Focus rating</button>
  <button type="button" @click="blur">Blur rating</button>
  <output>{{ value }} / {{ changed }} / {{ hover }} / {{ focusType }} / {{ blurType }}</output>
</template>
