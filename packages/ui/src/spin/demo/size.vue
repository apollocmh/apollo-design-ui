<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { Spin } from '../../index';

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};
</script>

<template>
  <div :style="rowStyle">
    <Spin size="small" />
    <Spin />
    <Spin size="large" />
  </div>
</template>
