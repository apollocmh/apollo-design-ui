<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { Spin } from '../../index';

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flexWrap: 'wrap',
};
const contentStyle = {
  padding: '50px',
  background: 'var(--apollo-color-fill-quaternary)',
  borderRadius: '4px',
};
</script>

<template>
  <div :style="rowStyle">
    <Spin description="Loading" size="small">
      <div :style="contentStyle" />
    </Spin>
    <Spin description="Loading">
      <div :style="contentStyle" />
    </Spin>
    <Spin description="Loading" size="large">
      <div :style="contentStyle" />
    </Spin>
  </div>
</template>
