<script setup lang="ts">
import { Spin } from '../../index';

const rowStyle = { display: 'flex', alignItems: 'center', gap: '16px' };
</script>

<template>
  <div :style="rowStyle">
    <Spin size="small" />
    <Spin />
    <Spin size="large" />
  </div>
</template>
