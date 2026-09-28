<script setup lang="ts">
// 对齐 antd 的 controlled demo：受控 + v-model:value

import { Segmented } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref('Map');
</script>

<template>
  <Segmented v-model:value="value" :options="['Map', 'Transit', 'Satellite']" />
</template>
