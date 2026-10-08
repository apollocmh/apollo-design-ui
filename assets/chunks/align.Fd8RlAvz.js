const n=`<script setup lang="ts">
// 对齐 antd 的 align demo（Segmented 用原生 select 等价替换，缺口见 README §7）

import type { FlexAlign, FlexJustify } from '@apollo-design/ui';
import { Flex } from '@apollo-design/ui';
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
  borderRadius: '6px',
  border: '1px solid #40a9ff',
};
<\/script>

<template>
  <Flex gap="medium" align="start" vertical>
    <p>Select justify :</p>
    <select v-model="justify" aria-label="Select justify">
      <option v-for="o in justifyOptions" :key="o" :value="o">{{ o }}</option>
    </select>
    <p>Select align :</p>
    <select v-model="align" aria-label="Select align">
      <option v-for="o in alignOptions" :key="o" :value="o">{{ o }}</option>
    </select>
    <Flex :style="boxStyle" :justify="justify" :align="align">
      <button type="button">Primary</button>
      <button type="button">Primary</button>
      <button type="button">Primary</button>
      <button type="button">Primary</button>
    </Flex>
  </Flex>
</template>
`;export{n as default};
