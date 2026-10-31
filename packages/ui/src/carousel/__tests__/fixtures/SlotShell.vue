<script setup lang="ts">
import type { VNodeChild } from 'vue';

defineProps<{ stamp: string }>();
defineSlots<{ default: (scope: { stamp: string }) => VNodeChild }>();
</script>
<template><article class="slot-shell"><slot :stamp="stamp" /></article></template>
