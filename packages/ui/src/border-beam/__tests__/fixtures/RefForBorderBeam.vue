<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import BorderBeam from '../../BorderBeam';

const rows = ref(['one']);
const hosts = useTemplateRef<HTMLButtonElement[]>('hosts');
defineExpose({
  rows,
  get elements() {
    return hosts.value;
  },
});
</script>
<template>
  <BorderBeam>
    <button v-for="row in rows" :key="row" ref="hosts" type="button">{{ row }}</button>
  </BorderBeam>
</template>
