<script setup lang="ts">
import type { FlexAlign, FlexJustify } from '@apollo-design/ui';
import { Button, Flex, Select } from '@apollo-design/ui';
import { ref } from 'vue';

const justifyOptions = [
  'flex-start',
  'center',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
];
const alignOptions = ['flex-start', 'center', 'flex-end'];
const justify = ref<FlexJustify>('flex-start');
const align = ref<FlexAlign>('flex-start');
const boxStyle = {
  width: '100%',
  height: '120px',
  borderRadius: 'var(--apollo-border-radius)',
  border: '1px solid var(--apollo-color-border)',
};
</script>

<template>
  <Flex gap="medium" align="start" vertical>
    <p>Select justify :</p>
    <Select v-model:value="justify" aria-label="Select justify" style="width: 180px" :options="justifyOptions.map(value => ({ value, label: value }))" />
    <p>Select align :</p>
    <Select v-model:value="align" aria-label="Select align" style="width: 180px" :options="alignOptions.map(value => ({ value, label: value }))" />
    <Flex :style="boxStyle" :justify="justify" :align="align">
      <Button>Task</Button>
      <Button>Task</Button>
      <Button>Task</Button>
      <Button>Task</Button>
    </Flex>
  </Flex>
</template>
