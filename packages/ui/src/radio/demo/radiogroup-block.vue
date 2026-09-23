<script setup lang="ts">
// 对齐 antd 的 radiogroup-block demo
import { Flex, Radio } from '@apollo-design/ui';

const options = [
  { label: 'Apple', value: 'Apple' },
  { label: 'Pear', value: 'Pear' },
  { label: 'Orange', value: 'Orange' },
];
</script>

<template>
  <Flex vertical gap="medium">
    <Radio.Group block :options="options" default-value="Apple" />
    <Radio.Group block :options="options" default-value="Apple" option-type="button" button-style="solid" />
    <Radio.Group block :options="options" default-value="Pear" option-type="button" />
  </Flex>
</template>
