<script setup lang="ts">
import { ref } from 'vue';
import { Space } from '../../index';

const singleCol = ref(false);

const box = { width: '150px', height: '100px', background: 'red' } as const;
</script>

<template>
  <label>
    <input v-model="singleCol" type="checkbox" />
    single column
  </label>
  <div :style="{ boxShadow: '0 0 5px green' }">
    <Space
      :style="{ width: singleCol ? '307px' : '310px', background: 'blue' }"
      :size="[8, 8]"
      wrap
    >
      <div :style="box" />
      <div :style="box" />
      <div :style="box" />
      <div :style="box" />
    </Space>
  </div>
</template>
