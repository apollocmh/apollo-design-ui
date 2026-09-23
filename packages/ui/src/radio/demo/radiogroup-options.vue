<script setup lang="ts">
// 对齐 antd 的 radiogroup-options demo（options 的四种写法 × 两种形态）
import { Radio } from '@apollo-design/ui';
import { ref } from 'vue';

const plainOptions = ['Apple', 'Pear', 'Orange'];

const options = [
  { label: 'Apple', value: 'Apple', className: 'label-1' },
  { label: 'Pear', value: 'Pear', className: 'label-2' },
  { label: 'Orange', value: 'Orange', title: 'Orange', className: 'label-3' },
];

const optionsWithDisabled = [
  { label: 'Apple', value: 'Apple', className: 'label-1' },
  { label: 'Pear', value: 'Pear', className: 'label-2' },
  { label: 'Orange', value: 'Orange', className: 'label-3', disabled: true },
];

const value1 = ref('Apple');
const value2 = ref('Apple');
const value3 = ref('Apple');
const value4 = ref('Apple');
</script>

<template>
  <Radio.Group v-model:value="value1" :options="plainOptions" />
  <br />
  <Radio.Group v-model:value="value2" :options="optionsWithDisabled" />
  <br />
  <br />
  <Radio.Group v-model:value="value3" :options="options" option-type="button" />
  <br />
  <br />
  <Radio.Group
    v-model:value="value4"
    :options="optionsWithDisabled"
    option-type="button"
    button-style="solid"
  />
</template>
