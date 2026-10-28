<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
</script>
<template><Space :size="[8, 16]" wrap><Button v-for="i in 20" :key="i">Button {{ i }}</Button></Space></template>
