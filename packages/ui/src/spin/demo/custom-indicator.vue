<script setup lang="ts">
import type { SpinSize } from '../../index';
import { Spin } from '../../index';

const sizes = ['small', 'medium', 'large'] satisfies SpinSize[];
</script>

<template>
  <div style="display: flex; align-items: center; gap: 16px">
    <Spin v-for="size in sizes" :key="size" :size="size">
      <template #indicator>
        <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="42 14" />
        </svg>
      </template>
    </Spin>
    <Spin>
      <template #indicator>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="42 14" />
        </svg>
      </template>
    </Spin>
    <Spin :percent="42">
      <template #indicator="{ percent }"><span style="color: var(--apollo-color-text)">{{ percent }}%</span></template>
    </Spin>
  </div>
</template>
