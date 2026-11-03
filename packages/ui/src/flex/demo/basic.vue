<script setup lang="ts">
import { Flex, Radio } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<'horizontal' | 'vertical'>('horizontal');
const baseStyle = { width: '25%', height: '54px' };
</script>

<template>
  <Flex gap="middle" vertical>
    <fieldset style="margin: 0; padding: 0; border: 0; min-width: 0">
      <legend>Direction</legend>
      <Radio.Group v-model:value="value" :options="['horizontal', 'vertical']" />
    </fieldset>
    <Flex :vertical="value === 'vertical'">
      <div v-for="i in 4" :key="i" :style="{ ...baseStyle, background: i % 2 ? 'var(--apollo-color-primary)' : 'var(--apollo-color-primary-bg-hover)' }" />
    </Flex>
  </Flex>
</template>
