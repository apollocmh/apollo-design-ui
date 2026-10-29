<script setup>
import { InputOTP, InputPassword } from '@input-source/input/index.ts';

defineProps({ family: String });
</script>
<template>
  <InputPassword v-if="family==='InputPassword'" aria-label="Scoped icon password">
    <template #icon="{visible}"><strong data-slot-icon>{{String(visible)}}</strong></template>
  </InputPassword>
  <InputOTP v-else :length="4" aria-label="Scoped separators">
    <template #separator="{index}"><strong :data-slot-index="index">{{index}}</strong></template>
  </InputOTP>
</template>
